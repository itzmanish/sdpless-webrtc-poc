// NOTE: This is needed until @types/sdp-transform is fixed.
// PR: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/64119
export type SimulcastStream = SimulcastFormat[];

// NOTE: Same as above.
export type SimulcastFormat =
	{
		scid: number | string;
		paused: boolean;
	};


export type IceParameters =
	{
		/**
		 * ICE username fragment.
		 * */
		usernameFragment: string;
		/**
		 * ICE password.
		 */
		password: string;
		/**
		 * ICE Lite.
		 */
		iceLite?: boolean;
	};

export type IceCandidate =
	{
		/**
		 * Unique identifier that allows ICE to correlate candidates that appear on
		 * multiple transports.
		 */
		foundation: string;
		/**
		 * The assigned priority of the candidate.
		 */
		priority: number;
		/**
		 * The IP address of the candidate.
		 */
		ip: string;
		/**
		 * The protocol of the candidate.
		 */
		protocol: 'udp' | 'tcp';
		/**
		 * The port for the candidate.
		 */
		port: number;
		/**
		 * The type of candidate.
		 */
		type: 'host' | 'srflx' | 'prflx' | 'relay';
		/**
		 * The type of TCP candidate.
		 */
		tcpType?: 'active' | 'passive' | 'so';
	};

export type DtlsParameters =
	{
		/**
		 * Server DTLS role. Default 'auto'.
		 */
		role?: DtlsRole;
		/**
		 * Server DTLS fingerprints.
		 */
		fingerprints: DtlsFingerprint[];
	};

/**
 * The hash function algorithm (as defined in the "Hash function Textual Names"
 * registry initially specified in RFC 4572 Section 8) and its corresponding
 * certificate fingerprint value (in lowercase hex string as expressed utilizing
 * the syntax of "fingerprint" in RFC 4572 Section 5).
 */
export type DtlsFingerprint =
	{
		algorithm: string;
		value: string;
	};

export type DtlsRole = 'auto' | 'client' | 'server';