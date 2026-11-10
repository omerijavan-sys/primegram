import { getRtcConfig } from "./iceConfig";

export interface SignalingMessage {

  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended';
  payload: any;
  from: string;
  to: string;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onCallEnded: (() => void) | null = null;
  private signalingChannel: any = null;

  constructor() {
    // Google STUN cluster for NAT traversal (shared config)
    this.peerConnection = new RTCPeerConnection(getRtcConfig());

    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    // Handle incoming ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          payload: event.candidate,
          from: '', // Will be set by caller
          to: '' // Will be set by caller
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'disconnected' || 
          this.peerConnection.connectionState === 'failed') {
        if (this.onCallEnded) {
          this.onCallEnded();
        }
      }
    };
  }

  async startLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false,
        audio: audio
      });

      // Add local stream tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream!);
      });

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(answer);
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    await this.peerConnection.addIceCandidate(candidate);
  }

  setSignalingChannel(channel: any) {
    this.signalingChannel = channel;
  }

  private sendSignalingMessage(message: SignalingMessage) {
    if (this.signalingChannel) {
      this.signalingChannel.send(message);
    }
  }

  setOnRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  setOnCallEnded(callback: () => void) {
    this.onCallEnded = callback;
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    this.peerConnection.close();
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.peerConnection.connectionState;
  }
}
