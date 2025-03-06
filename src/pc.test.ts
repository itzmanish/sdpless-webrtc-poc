import * as sdpTransform from 'sdp-transform'
// const sdpOffer = "v=0\r\no=- 2683082134293559811 3 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS dc101aa4-6f6c-4f9a-afb5-7754ffaa6b79\r\nm=application 60415 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 45.64.226.10\r\na=candidate:2808170844 1 udp 2122194687 192.168.1.108 60415 typ host generation 0 network-id 1 network-cost 10\r\na=candidate:933589150 1 udp 2122265343 fdd8:d4b5:e995:0:18a6:c5de:5e:84d8 50803 typ host generation 0 network-id 2 network-cost 10\r\na=candidate:137078882 1 udp 1685987071 45.64.226.10 60415 typ srflx raddr 192.168.1.108 rport 60415 generation 0 network-id 1 network-cost 10\r\na=candidate:3652103108 1 tcp 1518214911 192.168.1.108 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r\na=candidate:1231720966 1 tcp 1518285567 fdd8:d4b5:e995:0:18a6:c5de:5e:84d8 9 typ host tcptype active generation 0 network-id 2 network-cost 10\r\na=ice-ufrag:/EDh\r\na=ice-pwd:28yzu51yazf7st8hnC8x8eRV\r\na=ice-options:trickle\r\na=fingerprint:sha-256 E4:31:E9:07:04:1C:08:A0:17:AE:F0:AF:9A:ED:D9:CF:86:2C:71:6D:66:B8:68:55:BB:99:58:FC:F5:AD:A9:6B\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:/EDh\r\na=ice-pwd:28yzu51yazf7st8hnC8x8eRV\r\na=ice-options:trickle\r\na=fingerprint:sha-256 E4:31:E9:07:04:1C:08:A0:17:AE:F0:AF:9A:ED:D9:CF:86:2C:71:6D:66:B8:68:55:BB:99:58:FC:F5:AD:A9:6B\r\na=setup:actpass\r\na=mid:1\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=sendonly\r\na=msid:dc101aa4-6f6c-4f9a-afb5-7754ffaa6b79 b4b80e1a-032d-4e22-bb50-b2e8e27a2b8e\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=ssrc:3836120218 cname:45hhnK4mt7ydShZd\r\na=ssrc:3836120218 msid:dc101aa4-6f6c-4f9a-afb5-7754ffaa6b79 b4b80e1a-032d-4e22-bb50-b2e8e27a2b8e\r\n"

test('parsed offer', async () => {
    const pc = new RTCPeerConnection()

    pc.createDataChannel("hacky")
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await sleep(2000);
    const desc = sdpTransform.parse(pc.localDescription?.sdp!)
    console.log(desc);
});

async function sleep(duration: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration)
    })
}