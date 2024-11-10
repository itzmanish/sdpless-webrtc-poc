package main

import (
	"fmt"

	"github.com/pion/sdp/v3"
	"github.com/pion/webrtc/v4"
)

type RemoteSdp struct {
	params Parameters
	desc   *sdp.SessionDescription
}

func NewRemoteSDP() *RemoteSdp {
	return &RemoteSdp{
		desc: &sdp.SessionDescription{
			Version: 0,
			Origin: sdp.Origin{
				Username:       "pion",
				SessionID:      2683082134293559811,
				SessionVersion: 0,
				NetworkType:    "IN",
				AddressType:    "IP4",
				UnicastAddress: "127.0.0.1",
			},
			SessionName: "-",
			TimeDescriptions: []sdp.TimeDescription{
				{
					Timing: sdp.Timing{
						StartTime: 0,
						StopTime:  0,
					},
				},
			},
			Attributes: []sdp.Attribute{
				sdp.NewAttribute("extmap-allow-mixed", ""),
				sdp.NewAttribute("msid-semantic", "WMS"),
				sdp.NewAttribute("group", "BUNDLE 0"),
			},
		},
	}
}

func (rsdp *RemoteSdp) SetParams(params Parameters) {
	rsdp.params = params
	mediaDesc := &sdp.MediaDescription{
		MediaName: sdp.MediaName{
			Media:   "application",
			Port:    sdp.RangedPort{Value: 9}, // get from client
			Protos:  []string{"UDP", "DTLS", "SCTP"},
			Formats: []string{"webrtc-datachannel"},
		},
		ConnectionInformation: &sdp.ConnectionInformation{
			NetworkType: "IN",
			AddressType: "IP4",
			Address: &sdp.Address{
				Address: "0.0.0.0", // get from client
			},
		},
		Attributes: []sdp.Attribute{
			sdp.NewAttribute("ice-ufrag", params.IceParameters.UsernameFragment),
			sdp.NewAttribute("ice-pwd", params.IceParameters.Password),
			sdp.NewAttribute("max-message-size", fmt.Sprintf("%d", params.SctpParameters.MaxMessageSize)),
			sdp.NewAttribute("sctp-port", "5000"),
			sdp.NewAttribute("mid", "0"),
			sdp.NewAttribute("setup", "actpass"),
		},
	}
	if len(params.DtlsParameters.Fingerprints) > 0 {
		fingerprint := params.DtlsParameters.Fingerprints[0]
		rsdp.desc = rsdp.desc.WithFingerprint(fingerprint.Algorithm, fingerprint.Value)
	}

	rsdp.desc = rsdp.desc.WithMedia(mediaDesc)

}

func (rsdp *RemoteSdp) GetOffer() (webrtc.SessionDescription, error) {
	wsdp := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
	}
	b, err := rsdp.desc.Marshal()
	if err != nil {
		return wsdp, err
	}
	wsdp.SDP = string(b)
	return wsdp, nil
}

func (rsdp *RemoteSdp) SetOffer() {}
