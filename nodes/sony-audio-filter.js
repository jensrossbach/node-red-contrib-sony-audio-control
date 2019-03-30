module.exports = function(RED)
{
    const uriRegEx = /^([a-zA-Z0-9\-]+)\:([a-zA-Z0-9\-]+)(?:\?port\=([0-9]))?$/;

    function SonyAudioFilterNode(config)
    {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.filters = config.filters;
        this.outputs = config.outputs;

        this.device = RED.nodes.getNode(config.device);
        if (this.device)
        {
            this.on("input", msg =>
            {
                if (typeof msg.method == "string")
                {
                    let outputs = [];

                    for (i=0; i<this.filters.length; ++i)
                    {
                        outputs.push(null);

                        switch (this.filters[i])
                        {
                            case "powered":
                            {
                                if (((msg.method == "getPowerStatus") ||
                                     (msg.method == "notifyPowerStatus")) &&
                                    (msg.payload !== null))
                                {
                                    outputs[i] = {payload: (msg.payload.status == "active")};
                                }

                                break;
                            }
                            case "standby":
                            {
                                if (((msg.method == "getPowerStatus") ||
                                     (msg.method == "notifyPowerStatus")) &&
                                    (msg.payload !== null))
                                {
                                    outputs[i] = {payload: (msg.payload.status == "standby")};
                                }

                                break;
                            }
                            case "source":
                            {
                                if (msg.payload !== null)
                                {
                                    let uri = null;

                                    if (msg.method == "getPlayingContentInfo")
                                    {
                                        uri = msg.payload[0].uri;
                                    }
                                    else if (msg.method == "notifyPlayingContentInfo")
                                    {
                                        uri = msg.payload.uri;
                                    }

                                    if (uri !== null)
                                    {
                                        let matches = uri.match(uriRegEx);
                                        if (matches !== null)
                                        {
                                            let payload = {type: matches[1], source: matches[2]};
                                            if (matches[3] != null)
                                            {
                                                payload["port"] = Number(matches[3]);
                                            }

                                            outputs[i] = {payload: payload};
                                        }
                                    }
                                }

                                break;
                            }
                            case "volume":
                            {
                                if (msg.payload != null)
                                {
                                    if (msg.method == "getVolumeInformation")
                                    {
                                        outputs[i] = {payload: msg.payload[0].volume};
                                    }
                                    else if (msg.method == "notifyVolumeInformation")
                                    {
                                        outputs[i] = {payload: msg.payload.volume};
                                    }
                                }

                                break;
                            }
                            case "muted":
                            {
                                if (msg.payload !== null)
                                {
                                    let mute = null;

                                    if (msg.method == "getVolumeInformation")
                                    {
                                        mute = msg.payload[0].mute;
                                    }
                                    else if (msg.method == "notifyVolumeInformation")
                                    {
                                        mute = msg.payload.mute;
                                    }

                                    if ((mute !== null) && (mute != "toggle"))
                                    {
                                        outputs[i] = {payload: (mute == "on")};
                                    }
                                }

                                break;
                            }
                        }
                    }

                    this.send(outputs);
                }
            });
        }
    }

    RED.nodes.registerType("sony-audio-filter", SonyAudioFilterNode);
}