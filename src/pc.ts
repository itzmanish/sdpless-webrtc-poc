import * as sdpTransform from 'sdp-transform';
import { DtlsParameters, IceCandidate, IceParameters } from "./types"

export function setupPC() {
    const pc = new RTCPeerConnection()

    // const remoteSDP = new RemoteSdp()
}

class RemoteSdp {
    // Remote ICE parameters.
    private _iceParameters?: IceParameters;
    // Remote ICE candidates.
    private readonly _iceCandidates?: IceCandidate[];
    // Remote DTLS parameters.
    private readonly _dtlsParameters?: DtlsParameters;
    // SDP object.
    private readonly _sdpObject: sdpTransform.SessionDescription;
    constructor(
        {
            iceParameters,
            iceCandidates,
            dtlsParameters,
        }:
            {
                iceParameters?: IceParameters;
                iceCandidates?: IceCandidate[];
                dtlsParameters?: DtlsParameters;
            }
    ) {
        this._iceParameters = iceParameters;
        this._iceCandidates = iceCandidates;
        this._dtlsParameters = dtlsParameters;
        this._sdpObject =
        {
            version: 0,
            origin:
            {
                address: '0.0.0.0',
                ipVer: 4,
                netType: 'IN',
                sessionId: 10000,
                sessionVersion: 0,
                username: 'pion'
            },
            name: '-',
            timing: { start: 0, stop: 0 },
            media: []
        };

        // If ICE parameters are given, add ICE-Lite indicator.
        if (iceParameters && iceParameters.iceLite) {
            this._sdpObject.icelite = 'ice-lite';
        }

        // If DTLS parameters are given, assume WebRTC and BUNDLE.
        if (dtlsParameters) {
            this._sdpObject.msidSemantic = { semantic: 'WMS', token: '*' };

            // NOTE: We take the latest fingerprint.
            const numFingerprints = this._dtlsParameters!.fingerprints.length;

            this._sdpObject.fingerprint =
            {
                type: dtlsParameters.fingerprints[numFingerprints - 1].algorithm,
                hash: dtlsParameters.fingerprints[numFingerprints - 1].value
            };

            this._sdpObject.groups = [{ type: 'BUNDLE', mids: '' }];
        }

        this._sdpObject.media

    }


    getAnswer() {

    }
}

type Parameters = {
    candidates: IceCandidate[],
    dtlsParameters: DtlsParameters,
    iceParameters: IceParameters,
}