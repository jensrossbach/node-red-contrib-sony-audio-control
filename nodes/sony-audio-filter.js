/*
 * Copyright (c) 2019 Jens-Uwe Rossbach
 *
 * This code is licensed under the MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

module.exports = function(RED)
{
    const uriRegEx = /^([a-zA-Z0-9\-]+)\:([a-zA-Z0-9\-]+)(?:\?port\=([0-9]))?$/;

    function SonyAudioFilterNode(config)
    {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.filters = config.filters;
        this.outputs = config.outputs;

        if (this.outputs == 0)
        {
            this.status({fill: "red", shape: "dot", text: "no filters"});
        }
        else
        {
            this.status({});

            this.on("input", msg =>
            {
                if (typeof msg.method == "string")
                {
                    let outputs = [];

                    for (i=0; i<this.filters.length; ++i)
                    {
                        outputs.push(null);

                        switch (this.filters[i].name)
                        {
                            case "powered":
                            {
                                if (((msg.method == "getPowerStatus") ||
                                    (msg.method == "notifyPowerStatus")) &&
                                    (msg.payload !== null))
                                {
                                    let isPowered = (msg.payload.status == "active");

                                    if (!this.filters[i].args.onlyIfTrue ||
                                        (this.filters[i].args.onlyIfTrue && isPowered))
                                    {
                                        outputs[i] = {payload: isPowered};
                                    }
                                }

                                break;
                            }
                            case "standby":
                            {
                                if (((msg.method == "getPowerStatus") ||
                                    (msg.method == "notifyPowerStatus")) &&
                                    (msg.payload !== null))
                                {
                                    let isStandby = (msg.payload.status == "standby");

                                    if (!this.filters[i].args.onlyIfTrue ||
                                        (this.filters[i].args.onlyIfTrue && isStandby))
                                    {
                                        outputs[i] = {payload: isStandby};
                                    }
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
                            case "absoluteVolume":
                            {
                                if (msg.payload != null)
                                {
                                    if (msg.method == "getVolumeInformation")
                                    {
                                        if (msg.payload[0].volume >= 0)
                                        {
                                            outputs[i] = {payload: msg.payload[0].volume};
                                        }
                                    }
                                    else if (msg.method == "notifyVolumeInformation")
                                    {
                                        if (msg.payload.volume >= 0)
                                        {
                                            outputs[i] = {payload: msg.payload.volume};
                                        }
                                    }
                                }

                                break;
                            }
                            case "relativeVolume":
                            {
                                if (msg.payload != null)
                                {
                                    if (msg.method == "getVolumeInformation")
                                    {
                                        if (msg.payload[0].step != 0)
                                        {
                                            outputs[i] = {payload: msg.payload[0].step};
                                        }
                                    }
                                    else if (msg.method == "notifyVolumeInformation")
                                    {
                                        if (msg.payload.step != 0)
                                        {
                                            outputs[i] = {payload: msg.payload.step};
                                        }
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
                            case "soundSetting":
                            {
                                if ((msg.payload !== null) &&
                                    (msg.method == "getSoundSettings"))
                                {
                                    if (this.filters[i].args.setting === "any")
                                    {
                                        if (msg.payload.length > 0)
                                        {
                                            let setting =  msg.payload[0];

                                            if (("target" in setting) &&
                                                ("currentValue" in setting))
                                            {
                                                switch (setting.target)
                                                {
                                                    case "soundField":
                                                    case "voice":
                                                    {
                                                        outputs[i] = {payload: setting.currentValue};
                                                        break;
                                                    }
                                                    case "clearAudio":
                                                    case "nightMode":
                                                    case "footballMode":
                                                    {
                                                        outputs[i] = {payload: (setting.currentValue === "on")};
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        for (j=0; j<msg.payload.length; ++j)
                                        {
                                            let setting =  msg.payload[j];

                                            if (("target" in setting) &&
                                                ("currentValue" in setting))
                                            {
                                                if (setting.target === this.filters[i].args.setting)
                                                {
                                                    switch (setting.target)
                                                    {
                                                        case "soundField":
                                                        case "voice":
                                                        {
                                                            outputs[i] = {payload: setting.currentValue};
                                                            break;
                                                        }
                                                        case "clearAudio":
                                                        case "nightMode":
                                                        case "footballMode":
                                                        {
                                                            outputs[i] = {payload: (setting.currentValue === "on")};
                                                            break;
                                                        }
                                                    }

                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }

                                break;
                            }
                            case "playbackMode":
                            {
                                if ((msg.payload !== null) &&
                                    (msg.method == "getPlaybackModeSettings"))
                                {
                                    if (this.filters[i].args.mode === "any")
                                    {
                                        if (msg.payload.length > 0)
                                        {
                                            let setting =  msg.payload[0];

                                            if (("target" in setting) &&
                                                ("currentValue" in setting))
                                            {
                                                outputs[i] = {payload: setting.currentValue};
                                            }
                                        }
                                    }
                                    else
                                    {
                                        for (j=0; j<msg.payload.length; ++j)
                                        {
                                            let setting =  msg.payload[j];

                                            if (("target" in setting) &&
                                                ("currentValue" in setting))
                                            {
                                                if (setting.target === this.filters[i].args.mode)
                                                {
                                                    outputs[i] = {payload: setting.currentValue};
                                                    break;
                                                }
                                            }
                                        }
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