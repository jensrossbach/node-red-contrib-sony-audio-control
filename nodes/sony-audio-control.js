module.exports = function(RED)
{
    function SonyAudioControlNode(config)
    {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.command = config.command;

        function setPowerStatus(status)
        {
            return {service: "system",
                    method: "setPowerStatus",
                    version: "1.1",
                    payload: [{status: status}]};
        }

        function setAudioVolume(volume, step = 0, zone = null)
        {
            return {service: "audio",
                    method: "setAudioVolume",
                    version: "1.1",
                    payload: [{output: (zone !== null) ? "extOutput:zone?zone=" + zone : "",
                               volume: (step > 0) ? "+" + step : (step < 0) ? step.toString() : volume.toString()}]};
        }

        function setAudioMute(mute, zone = null)
        {
            return {service: "audio",
                    method: "setAudioMute",
                    version: "1.1",
                    payload: [{output: (zone !== null) ? "extOutput:zone?zone=" + zone : "",
                               mute: mute}]};
        }

        function setSoundSettings(params)
        {
            return {service: "audio",
                    method: "setSoundSettings",
                    version: "1.1",
                    payload: [{settings: params}]};
        }

        function setPlayContent(type, source, port = null)
        {
            var uri = type + ":" + source;
            if (port !== null)
            {
                uri += "?port=" + port;
            }

            return {service: "avContent",
                    method: "setPlayContent",
                    version: "1.2",
                    payload: [{uri: uri}]};
        }

        function getPowerStatus()
        {
            return {service: "system",
                    method: "getPowerStatus",
                    version: "1.1",
                    payload: []};
        }

        function getPlayingContentInfo()
        {
            return {service: "avContent",
                    method: "getPlayingContentInfo",
                    version: "1.2",
                    payload: [{}]};
        }

        function getVolumeInfo(zone = null)
        {
            return {service: "audio",
                    method: "getVolumeInformation",
                    version: "1.1",
                    payload: [{output: (zone !== null) ? "extOutput:zone?zone=" + zone : ""}]};
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
                var cmd = (("command" in msg) && (typeof msg.command == "string")) ? msg.command : this.command;

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
                        if (typeof msg.payload == "number")
                        {
                            this.send(setAudioVolume(msg.payload));
                        }
                        else if (typeof msg.payload == "object")
                        {
                            let volume = -1;
                            let step = 0;
                            let zone = null;

                            if (typeof msg.payload.step == "number")
                            {
                                step = msg.payload.step;
                            }
                            else if (typeof msg.payload.volume == "number")
                            {
                                volume = msg.payload.volume;
                            }

                            if (typeof msg.payload.zone == "number")
                            {
                                zone = msg.payload.zone;
                            }

                            if ((volume >= 0) || (step != 0))
                            {
                                this.send(setAudioVolume(volume, step, zone));
                            }
                            else
                            {
                                let errMsg = {method: "_passthrough", payload: {error: 32768, description: "Invalid node input"}};
                                this.send(errMsg);
                            }
                        }
                        else
                        {
                            let errMsg = {method: "_passthrough", payload: {error: 32768, description: "Invalid node input"}};
                            this.send(errMsg);
                        }

                        break;
                    }
                    case "mute":
                    {
                        if (typeof msg.payload == "number")
                        {
                            this.send(setAudioMute("on", msg.payload));
                        }
                        else
                        {
                            this.send(setAudioMute("on"));
                        }

                        break;
                    }
                    case "unmute":
                    {
                        if (typeof msg.payload == "number")
                        {
                            this.send(setAudioMute("off", msg.payload));
                        }
                        else
                        {
                            this.send(setAudioMute("off"));
                        }

                        break;
                    }
                    case "toggleMute":
                    {
                        if (typeof msg.payload == "number")
                        {
                            this.send(setAudioMute("toggle", msg.payload));
                        }
                        else
                        {
                            this.send(setAudioMute("toggle"));
                        }

                        break;
                    }
                    case "setSoundSettings":
                    {
                        this.send(setSoundSettings(msg.payload));
                        break;
                    }
                    case "setSource":
                    {
                        if ((typeof msg.payload == "object") &&
                            (typeof msg.payload.type == "string") &&
                            (typeof msg.payload.source == "string"))
                        {
                            let port = null;
                            if (typeof msg.payload.port == "number")
                            {
                                port = msg.payload.port
                            }

                            this.send(setPlayContent(msg.payload.type, msg.payload.source, port));
                        }
                        else
                        {
                            let errMsg = {method: "_passthrough", payload: {error: 32768, description: "Invalid node input"}};
                            this.send(errMsg);
                        }

                        break;
                    }
                    case "getPowerStatus":
                    {
                        this.send(getPowerStatus());
                        break;
                    }
                    case "getSource":
                    {
                        this.send(getPlayingContentInfo());
                        break;
                    }
                    case "getVolumeInfo":
                    {
                        if (typeof msg.payload == "number")
                        {
                            this.send(getVolumeInfo(msg.payload));
                        }
                        else
                        {
                            this.send(getVolumeInfo());
                        }

                        break;
                    }
                    case "getSoundSettings":
                    {
                        if (typeof msg.payload == "string")
                        {
                            this.send(getSoundSettings(msg.payload));
                        }
                        else
                        {
                            let errMsg = {method: "_passthrough", payload: {error: 32768, description: "Invalid node input"}};
                            this.send(errMsg);
                        }

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