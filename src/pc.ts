import * as sdpTransform from 'sdp-transform';
import { DtlsParameters, IceCandidate, IceParameters } from "./types"

export async function setupPC() {
    const pc = new RTCPeerConnection()

    pc.createDataChannel("hacky")
    const offer = await pc.createOffer()

    // const remoteSDP = new RemoteSdp({})
}

export class RemoteSdp {
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
        }: Parameters
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

    }


    getAnswer(offerSDP: sdpTransform.SessionDescription) {
        const media: {
            type: string;
            port: number;
            protocol: string;
            payloads?: string | undefined;
        } & sdpTransform.MediaDescription = {
            iceUfrag: this._iceParameters?.usernameFragment,
            icePwd: this._iceParameters?.password,
            type: "application",
            port: 60415,
            protocol: "UDP/DTLS/SCTP",
            payloads: "webrtc-datachannel",
            rtp: [],
            fmtp: [],
            mid: "0",
            setup: "actpass",
            connection: offerSDP.connection,
        }
        if (this._iceCandidates) {
            this._iceCandidates.forEach((candidate) => {
                const cd: {
                    foundation: string;
                    component: number;
                    transport: string;
                    priority: number | string;
                    ip: string;
                    port: number;
                    type: string;
                    raddr?: string | undefined;
                    rport?: number | undefined;
                    tcptype?: string | undefined;
                    generation?: number | undefined;
                    "network-id"?: number | undefined;
                    "network-cost"?: number | undefined;
                } = {
                    ...candidate,
                    transport: candidate.protocol,
                    component: 1,
                }
                media.candidates?.push(cd)
            })
        }
        this._sdpObject.media.push(media)
        return sdpTransform.write(this._sdpObject)
    }
}

type Parameters = {
    iceParameters: IceParameters;
    iceCandidates: IceCandidate[];
    dtlsParameters: DtlsParameters;
}