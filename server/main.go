package main

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"github.com/pion/interceptor"
	"github.com/pion/interceptor/pkg/intervalpli"
	"github.com/pion/webrtc/v4"
)

// nolint:gocognit
func main() {
	// Everything below is the Pion WebRTC API! Thanks for using it ❤️.
	log.Println("running server")
	// Create a MediaEngine object to configure the supported codec
	m := &webrtc.MediaEngine{}

	// Setup the codecs you want to use.
	// We'll use a VP8 and Opus but you can also define your own
	if err := m.RegisterCodec(webrtc.RTPCodecParameters{
		RTPCodecCapability: webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8, ClockRate: 90000, Channels: 0, SDPFmtpLine: "", RTCPFeedback: nil},
		PayloadType:        96,
	}, webrtc.RTPCodecTypeVideo); err != nil {
		panic(err)
	}

	// Create a InterceptorRegistry. This is the user configurable RTP/RTCP Pipeline.
	// This provides NACKs, RTCP Reports and other features. If you use `webrtc.NewPeerConnection`
	// this is enabled by default. If you are manually managing You MUST create a InterceptorRegistry
	// for each PeerConnection.
	i := &interceptor.Registry{}

	// Use the default set of Interceptors
	if err := webrtc.RegisterDefaultInterceptors(m, i); err != nil {
		panic(err)
	}

	// Register a intervalpli factory
	// This interceptor sends a PLI every 3 seconds. A PLI causes a video keyframe to be generated by the sender.
	// This makes our video seekable and more error resilent, but at a cost of lower picture quality and higher bitrates
	// A real world application should process incoming RTCP packets from viewers and forward them to senders
	intervalPliFactory, err := intervalpli.NewReceiverInterceptor()
	if err != nil {
		panic(err)
	}
	i.Add(intervalPliFactory)

	// Create the API object with the MediaEngine
	api := webrtc.NewAPI(webrtc.WithMediaEngine(m), webrtc.WithInterceptorRegistry(i))

	// Prepare the configuration
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}
	// Create a new RTCPeerConnection
	peerConnection, err := api.NewPeerConnection(config)
	if err != nil {
		panic(err)
	}
	defer func() {
		if cErr := peerConnection.Close(); cErr != nil {
			fmt.Printf("cannot close peerConnection: %v\n", cErr)
		}
	}()

	// Create Track that we send video back to browser on
	outputTrack, err := webrtc.NewTrackLocalStaticRTP(webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8}, "video", "pion")
	if err != nil {
		panic(err)
	}

	// Add this newly created track to the PeerConnection
	rtpSender, err := peerConnection.AddTrack(outputTrack)
	if err != nil {
		panic(err)
	}

	// Read incoming RTCP packets
	// Before these packets are returned they are processed by interceptors. For things
	// like NACK this needs to be called.
	go func() {
		rtcpBuf := make([]byte, 1500)
		for {
			if _, _, rtcpErr := rtpSender.Read(rtcpBuf); rtcpErr != nil {
				return
			}
		}
	}()

	remoteSDP := NewRemoteSDP()

	// Wait for the offer to be pasted
	params := Parameters{}
	log.Println("waiting for params, please paste it here..")
	decode(readUntilNewline(), &params)
	remoteSDP.SetParams(params)
	offer, err := remoteSDP.GetOffer()
	if err != nil {
		panic(err)
	}
	// Set the remote SessionDescription
	err = peerConnection.SetRemoteDescription(offer)
	if err != nil {
		panic(err)
	}

	// Set a handler for when a new remote track starts, this handler copies inbound RTP packets,
	// replaces the SSRC and sends them back
	peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) { //nolint: revive
		fmt.Printf("Track has started, of type %d: %s \n", track.PayloadType(), track.Codec().MimeType)
		for {
			// Read RTP packets being sent to Pion
			rtp, _, readErr := track.ReadRTP()
			if readErr != nil {
				panic(readErr)
			}

			if writeErr := outputTrack.WriteRTP(rtp); writeErr != nil {
				panic(writeErr)
			}
		}
	})

	// Set the handler for Peer connection state
	// This will notify you when the peer has connected/disconnected
	peerConnection.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		fmt.Printf("Peer Connection State has changed: %s\n", s.String())

		if s == webrtc.PeerConnectionStateFailed {
			// Wait until PeerConnection has had no network activity for 30 seconds or another failure. It may be reconnected using an ICE Restart.
			// Use webrtc.PeerConnectionStateDisconnected if you are interested in detecting faster timeout.
			// Note that the PeerConnection may come back from PeerConnectionStateDisconnected.
			fmt.Println("Peer Connection has gone to failed exiting")
			os.Exit(0)
		}

		if s == webrtc.PeerConnectionStateClosed {
			// PeerConnection was explicitly closed. This usually happens from a DTLS CloseNotify
			fmt.Println("Peer Connection has gone to closed exiting")
			os.Exit(0)
		}
	})

	// Create an answer
	answer, err := peerConnection.CreateAnswer(nil)
	if err != nil {
		panic(err)
	}
	localCadidates := []webrtc.ICECandidate{}
	peerConnection.OnICECandidate(func(i *webrtc.ICECandidate) {
		if i != nil {
			localCadidates = append(localCadidates, *i)
		}
	})
	// Create channel that is blocked until ICE Gathering is complete
	gatherComplete := webrtc.GatheringCompletePromise(peerConnection)

	// Sets the LocalDescription, and starts our UDP listeners
	if err = peerConnection.SetLocalDescription(answer); err != nil {
		panic(err)
	}

	// Block until ICE Gathering is complete, disabling trickle ICE
	// we do this because we only can exchange one signaling message
	// in a production application you should exchange ICE Candidates via OnICECandidate
	<-gatherComplete

	ansParams := &Parameters{
		Candidates: localCadidates,
	}

	ansParams.IceParameters, err = peerConnection.SCTP().Transport().ICETransport().GetLocalParameters()
	if err != nil {
		panic(err)
	}
	ansParams.DtlsParameters, err = peerConnection.SCTP().Transport().GetLocalParameters()
	if err != nil {
		panic(err)
	}
	// Output the answer in base64 so we can paste it in browser
	fmt.Println(encode(ansParams))

	// Block forever
	select {}
}

// Read from stdin until we get a newline
func readUntilNewline() (in string) {
	var err error

	r := bufio.NewReader(os.Stdin)
	for {
		in, err = r.ReadString('\n')
		if err != nil && !errors.Is(err, io.EOF) {
			panic(err)
		}

		if in = strings.TrimSpace(in); len(in) > 0 {
			break
		}
	}

	fmt.Println("")
	return
}

// JSON encode + base64 a SessionDescription
func encode(obj *Parameters) string {
	b, err := json.Marshal(obj)
	if err != nil {
		panic(err)
	}

	return base64.StdEncoding.EncodeToString(b)
}

// Decode a base64 and unmarshal JSON into a SessionDescription
func decode(in string, obj *Parameters) {
	b, err := base64.StdEncoding.DecodeString(in)
	if err != nil {
		panic(err)
	}

	if err = json.Unmarshal(b, obj); err != nil {
		panic(err)
	}
}