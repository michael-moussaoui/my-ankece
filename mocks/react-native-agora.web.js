// Stub for react-native-agora on web — no-op exports match the surface used
module.exports = {
  createAgoraRtcEngine: () => ({
    initialize: () => {},
    registerEventHandler: () => {},
    enableVideo: () => {},
    startPreview: () => {},
    joinChannel: () => {},
    leaveChannel: () => {},
    release: () => {},
  }),
  RtcSurfaceView: null,
  ChannelProfileType: {},
  ClientRoleType: {},
};
