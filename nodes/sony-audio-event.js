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
    const MSG_GET_NOTIFICATIONS = 1;
    const MSG_SET_NOTIFICATIONS = 2;

    const STATUS_UNCONFIGURED = {fill: "yellow", shape: "dot", text: "unconfigured"    };
    const STATUS_NOTCONNECTED = {fill: "grey",   shape: "dot", text: "not connected"   };
    const STATUS_CONNECTING   = {fill: "grey",   shape: "dot", text: "connecting"      };
    const STATUS_CONNECTED    = {fill: "blue",   shape: "dot", text: "connected"       };
    const STATUS_READY        = {fill: "green",  shape: "dot", text: "ready"           };
    const STATUS_ERROR        = {fill: "red",    shape: "dot", text: "connection error"};

    const WebSocketClient = require("websocket").client;

    function SonyAudioEventNode(config)
    {
        RED.nodes.createNode(this, config);
        var node = this;

        this.name = config.name;
        this.service = config.service;

        this.notifications = {notifyPowerStatus: config.notifyPowerStatus,
                              notifyStorageStatus: config.notifyStorageStatus,
                              notifySettingsUpdate: config.notifySettingsUpdate,
                              notifySWUpdateInfo: config.notifySWUpdateInfo,
                              notifyVolumeInformation: config.notifyVolumeInformation,
                              notifyExternalTerminalStatus: config.notifyExternalTerminalStatus,
                              notifyAvailablePlaybackFunction: config.notifyAvailablePlaybackFunction,
                              notifyPlayingContentInfo: config.notifyPlayingContentInfo};

        this.client = null;
        this.connection = null;

        function switchNotifications(id, disable, enable)
        {
            var params = {};

            if (disable != null)
            {
                params.disabled = disable;
            }

            if (enable != null)
            {
                params.enabled = enable;
            }

            return {id: id,
                    method: "switchNotifications",
                    version: "1.0",
                    params: [params]}
        }

        this.device = RED.nodes.getNode(config.device);
        if (this.device)
        {
            this.client = new WebSocketClient();

            this.client.on("connect", function(connection)
            {
                node.status(STATUS_CONNECTED);

                node.debug("Client connected");
                node.connection = connection;

                connection.on("message", function(message)
                {
                    if (message.type === "utf8")
                    {
                        let msg = JSON.parse(message.utf8Data);

                        if ("id" in msg)
                        {
                            if (msg.id == MSG_GET_NOTIFICATIONS)
                            {
                                let notif = msg.result[0].disabled.concat(msg.result[0].enabled);
                                let enable = [];
                                let disable = [];

                                notif.forEach(item =>
                                {
                                    if ((item.name in node.notifications) && (node.notifications[item.name]))
                                    {
                                        enable.push(item);
                                    }
                                    else
                                    {
                                        disable.push(item);
                                    }
                                });

                                let subscribeRequest = JSON.stringify(switchNotifications(MSG_SET_NOTIFICATIONS,
                                                                                          (disable.length == 0) ? null : disable,
                                                                                          (enable.length == 0) ? null : enable));

                                node.debug(subscribeRequest);
                                connection.sendUTF(subscribeRequest);
                            }
                            else if (msg.id == MSG_SET_NOTIFICATIONS)
                            {
                                node.status(STATUS_READY);
                                node.debug("Result: " + JSON.stringify(msg.result[0]));
                            }
                        }
                        else if (("method" in msg) && ("params" in msg))
                        {
                            if (msg.method in node.notifications)
                            {
                                node.debug("Event for " + msg.method + " received");

                                let outmsg = {service: node.service,
                                              method: msg.method,
                                              version: msg.version,
                                              payload: (msg.params.length == 0) ? null : msg.params[0]};

                                node.send(outmsg);
                            }
                            else
                            {
                                node.warn("Unsupported event: " + msg.method);
                            }
                        }
                    }
                });

                connection.on("error", function(error)
                {
                    node.status(STATUS_ERROR);
                    node.warn("Connection error: " + error.toString());
                });

                connection.on("close", function()
                {
                    node.status(STATUS_NOTCONNECTED);
                    node.debug("Connection closed");
                });

                connection.sendUTF(JSON.stringify(switchNotifications(MSG_GET_NOTIFICATIONS, [], [])));
            });

            this.client.on("connectFailed", function(error)
            {
                node.status(STATUS_ERROR);
                node.warn("Failed to connect to Sony device: " + error.toString());
            });

            this.on("close", function()
            {
                if (this.connection)
                {
                    this.connection.close();
                }
            });

            let url = "ws://" + this.device.host + ":" + this.device.port + "/sony/" + this.service;

            this.status(STATUS_CONNECTING);
            this.debug("Connecting to: " + url);
            this.client.connect(url);
        }
        else
        {
            this.status(STATUS_UNCONFIGURED);
        }
    }

    RED.nodes.registerType("sony-audio-event", SonyAudioEventNode);
}