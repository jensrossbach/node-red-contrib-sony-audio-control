module.exports = function(RED)
{
    function SonyAudioDeviceNode(config)
    {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.host = config.host;
        this.port = config.port;
    }

    RED.nodes.registerType("sony-audio-device", SonyAudioDeviceNode);
}