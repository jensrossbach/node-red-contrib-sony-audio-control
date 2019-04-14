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
    const request = require("request-promise");

    const STATUS_UNCONFIGURED = {fill: "yellow", shape: "dot", text: "unconfigured"};
    const STATUS_SENDING      = {fill: "grey",   shape: "dot", text: "sending"     };
    const STATUS_SUCCESS      = {fill: "green",  shape: "dot", text: "success"     };
    const STATUS_ERROR        = {fill: "red",    shape: "dot", text: "error"       };

    function SonyAudioRequestNode(config)
    {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.device = RED.nodes.getNode(config.device);

        this.timeout = null;

        this.setStatus = function(stat, temporary = false)
        {
            if (this.timeout != null)
            {
                clearTimeout(timeout);
                this.timeout = null;
            }

            this.status(stat);

            if (temporary)
            {
                this.timeout = setTimeout(() =>
                {
                    this.status({});
                    this.timeout = null;
                }, 5000);
            }
        }

        if (this.device)
        {
            this.baseURI = "http://" + this.device.host + ":" + this.device.port + "/sony";

            this.on("input", function(msg)
            {
                if ((typeof msg.service == "string") &&
                    (typeof msg.method == "string") &&
                    (typeof msg.version == "string") &&
                    (typeof msg.payload == "object"))
                {
                    const req = {method: "post",
                                 uri: this.baseURI + "/" + msg.service,
                                 json: true,
                                 body: {id: 1,
                                        method: msg.method,
                                        version: msg.version,
                                        params: (msg.payload == null) ? [] : [msg.payload]}};

                    this.setStatus(STATUS_SENDING);
                    request(req).then(response =>
                    {
                        if ("result" in response)
                        {
                            let respMsg = {service: msg.service,
                                           method: msg.method,
                                           version: msg.version,
                                           payload: (response.result.length == 1) ? response.result[0] : null};

                            this.send([respMsg, null]);
                            this.setStatus(STATUS_SUCCESS, true);
                        }
                        else if ("error" in response)
                        {
                            let respMsg = {service: msg.service,
                                           method: msg.method,
                                           version: msg.version,
                                           payload: {error: response.error[0],
                                                     description: response.error[1]}};

                            this.send([null, respMsg]);
                            this.setStatus(STATUS_ERROR, true);
                        }
                    }).catch(error =>
                    {
                        let respMsg = {service: msg.service,
                                       method: msg.method,
                                       version: msg.version,
                                       payload: {error: 32770,
                                                 description: error}};

                        this.send([null, respMsg]);
                        this.setStatus(STATUS_ERROR, true);
                    });
                }
                else if (msg.method === "_passthrough")
                {
                    // just forward the message to the error output
                    this.send([null, msg]);
                    this.setStatus(STATUS_ERROR, true);
                }
                else
                {
                    let respMsg = {payload: {error: 32768, description: "Invalid node input"}};
                    this.send([null, respMsg]);
                    this.setStatus(STATUS_ERROR, true);
                }
            });

            this.on("close", function()
            {
                if (this.timeout != null)
                {
                    clearTimeout(timeout);
                    this.timeout = null;
                }
            });
        }
        else
        {
            this.setStatus(STATUS_UNCONFIGURED);
        }
    }

    RED.nodes.registerType("sony-audio-request", SonyAudioRequestNode);
}