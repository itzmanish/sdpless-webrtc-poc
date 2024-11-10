package main

import "github.com/pion/webrtc/v4"

type Parameters struct {
	Candidates     []webrtc.ICECandidate
	DtlsParameters webrtc.DTLSParameters
	IceParameters  webrtc.ICEParameters
	SctpParameters webrtc.SCTPCapabilities
}
