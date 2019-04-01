module.exports = function(RED)
{
    function SonyAudioControlNode(config)
    {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.command = config.command;
        this.volume = config.volume;
        this.relative = config.relative;
        this.source = config.source;
        this.zone = config.zone;
        this.port = config.port;
        this.soundsettings = config.soundsettings;
        this.target = config.target;

        function setPowerStatus(status)
        {
            return {service: "system",
                    method: "setPowerStatus",
                    version: "1.1",
                    payload: [{status: status}]};
        }

        function setAudioVolume(volume, relative = false, zone = 0)
        {
            return {service: "audio",
                    method: "setAudioVolume",
                    version: "1.1",
                    payload: [{output: (zone > 0) ? "extOutput:zone?zone=" + zone : "",
                               volume: (relative && (volume > 0)) ? "+" + volume : volume.toString()}]};
        }

        function setAudioMute(mute, zone = 0)
        {
            return {service: "audio",
                    method: "setAudioMute",
                    version: "1.1",
                    payload: [{output: (zone > 0) ? "extOutput:zone?zone=" + zone : "",
                               mute: mute}]};
        }

        function setSoundSettings(params)
        {
            return {service: "audio",
                    method: "setSoundSettings",
                    version: "1.1",
                    payload: [{settings: params}]};
        }

        function setPlayContent(source, port = 0, zone = 0)
        {
            var uri = source;
            if ((source == "extInput:hdmi") && (port > 0))
            {
                uri += "?port=" + port;
            }

            return {service: "avContent",
                    method: "setPlayContent",
                    version: "1.2",
                    payload: [{output: (zone > 0) ? "extOutput:zone?zone=" + zone : "",
                               uri: uri}]};
        }

        function getPowerStatus()
        {
            return {service: "system",
                    method: "getPowerStatus",
                    version: "1.1",
                    payload: []};
        }

        function getPlayingContentInfo(zone = 0)
        {
            return {service: "avContent",
                    method: "getPlayingContentInfo",
                    version: "1.2",
                    payload: [{output: (zone > 0) ? "extOutput:zone?zone=" + zone : ""}]};
        }

        function getVolumeInfo(zone = 0)
        {
            return {service: "audio",
                    method: "getVolumeInformation",
                    version: "1.1",
                    payload: [{output: (zone > 0) ? "extOutput:zone?zone=" + zone : ""}]};
        }

        function getSoundSettings(target)
        {
            return {service: "audio",
                    method: "getSoundSettings",
                    version: "1.1",
                    payload: [{target: target}]};
        }

        this.device = RED.nodes.getNode(config.device);
        if (this.device)
        {
            this.on("input", function(msg)
            {
                var cmd = (typeof msg.command == "string") ? msg.command : this.command;

                switch (cmd)
                {
                    case "powerOn":
                    {
                        this.send(setPowerStatus("active"));
                        break;
                    }
                    case "powerOff":
                    {
                        this.send(setPowerStatus("off"));
                        break;
                    }
                    case "standby":
                    {
                        this.send(setPowerStatus("standby"));
                        break;
                    }
                    case "setVolume":
                    {
                        let args = {volume: this.volume,
                                    relativeVolume: this.relative,
                                    zone: this.zone};

                        if (typeof msg.payload == "object")
                        {
                            if (typeof msg.payload.volume == "number")
                            {
                                args.volume = msg.payload.volume;
                            }

                            if (typeof msg.payload.relativeVolume == "boolean")
                            {
                                args.relativeVolume = msg.payload.relativeVolume;
                            }

                            if (typeof msg.payload.zone == "number")
                            {
                                args.zone = msg.payload.zone;
                            }

                            if ((args.relativeVolume && (args.volume == 0)) ||
                                (!args.relativeVolume && (args.volume < 0)))
                            {
                                let errMsg = {method: "_passthrough", payload: {error: 32768, description: "Invalid node input"}};
                                this.send(errMsg);

                                break;
                            }
                        }

                        this.send(setAudioVolume(args.volume, args.relativeVolume, args.zone));
                        break;
                    }
                    case "mute":
                    {
                        let args = {zone: this.zone};

                        if ((typeof msg.payload == "object") &&
                            (typeof msg.payload.zone == "number"))
                        {
                            args.zone = msg.payload.zone;
                        }

                        this.send(setAudioMute("on", args.zone));
                        break;
                    }
                    case "unmute":
                    {
                        let args = {zone: this.zone};

                        if ((typeof msg.payload == "object") &&
                            (typeof msg.payload.zone == "number"))
                        {
                            args.zone = msg.payload.zone;
                        }

                        this.send(setAudioMute("off", args.zone));
                        break;
                    }
                    case "toggleMute":
                    {
                        let args = {zone: this.zone};

                        if ((typeof msg.payload == "object") &&
                            (typeof msg.payload.zone == "number"))
                        {
                            args.zone = msg.payload.zone;
                        }

                        this.send(setAudioMute("toggle", args.zone));
                        break;
                    }
                    case "setSoundSettings":
                    {
                        let args = {soundSettings: this.soundsettings};
                        if ((typeof msg.payload == "object") &&
                            Array.isArray(msg.payload.soundSettings))
                        {
                            args.soundSettings = msg.payload.soundSettings;
                        }

                        this.send(setSoundSettings(args.soundSettings));
                        break;
                    }
                    case "setSource":
                    {
                        let args = {source: this.source,
                                    port: this.port,
                                    zone: this.zone};

                        if (typeof msg.payload == "object")
                        {
                            if (typeof msg.payload.source == "string")
                            {
                                args.source = msg.payload.source;
                            }

                            if (typeof msg.payload.port == "number")
                            {
                                args.port = msg.payload.port
                            }

                            if (typeof msg.payload.zone == "number")
                            {
                                args.zone = msg.payload.zone;
                            }
                        }

                        this.send(setPlayContent(args.source, args.port, args.zone));
                        break;
                    }
                    case "getPowerStatus":
                    {
                        this.send(getPowerStatus());
                        break;
                    }
                    case "getSource":
                    {
                        let args = {zone: this.zone};

                        if ((typeof msg.payload == "object") &&
                            (typeof msg.payload.zone == "number"))
                        {
                            args.zone = msg.payload.zone;
                        }

                        this.send(getPlayingContentInfo(args.zone));
                        break;
                    }
                    case "getVolumeInfo":
                    {
                        let args = {zone: this.zone};

                        if ((typeof msg.payload == "object") &&
                            (typeof msg.payload.zone == "number"))
                        {
                            args.zone = msg.payload.zone;
                        }

                        this.send(getVolumeInfo(args.zone));
                        break;
                    }
                    case "getSoundSettings":
                    {
                        let args = {target: this.target};

                        if ((typeof msg.payload == "object") &&
                            (typeof msg.payload.target == "string"))
                        {
                            args.target = msg.payload.target;
                        }

                        this.send(getSoundSettings(args.target));
                        break;
                    }
                    default:
                    {
                        let errMsg = {method: "_passthrough", payload: {error: 32769, description: "Invalid command"}};
                        this.send(errMsg);
                    }
                }
            });
        }
    }

    RED.nodes.registerType("sony-audio-control", SonyAudioControlNode);
}