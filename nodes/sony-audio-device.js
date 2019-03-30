module.exports = function(RED)
{
    const MSG_GET_NOTIFICATIONS = 1;
    const MSG_SET_NOTIFICATIONS = 2;

    const WebSocketClient = require("websocket").client;

    function SonyAudioDeviceNode(config)
    {
        RED.nodes.createNode(this, config);
        var node = this;

        this.name = config.name;
        this.host = config.host;
        this.port = config.port;

        this.notifications = {notifyPowerStatus: config.notifyPowerStatus,
                              notifyStorageStatus: config.notifyStorageStatus,
                              notifySettingsUpdate: config.notifySettingsUpdate,
                              notifySWUpdateInfo: config.notifySWUpdateInfo,
                              notifyVolumeInformation: config.notifyVolumeInformation,
                              notifyExternalTerminalStatus: config.notifyExternalTerminalStatus,
                              notifyAvailablePlaybackFunction: config.notifyAvailablePlaybackFunction,
                              notifyPlayingContentInfo: config.notifyPlayingContentInfo};

        this.subscribers = {notifyPowerStatus: [],
                            notifyStorageStatus: [],
                            notifySettingsUpdate: [],
                            notifySWUpdateInfo: [],
                            notifyVolumeInformation: [],
                            notifyExternalTerminalStatus: [],
                            notifyAvailablePlaybackFunction: [],
                            notifyPlayingContentInfo: []};

        this.connections = [];

        function switchNotifications(id, disable, enable)
        {
            return {"id": id,
                    "method": "switchNotifications",
                    "version": "1.0",
                    "params": [{"disabled": disable,
                                "enabled": enable}]}
        }

        function onConnect(connection)
        {
            node.debug("WebSocket client connected");
            node.connections.push(connection);

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

                            node.debug("Enable: " + JSON.stringify(enable) + "  Disable: " + JSON.stringify(disable))
                            connection.sendUTF(JSON.stringify(switchNotifications(MSG_SET_NOTIFICATIONS, disable, enable)));
                        }
                        else if (msg.id == MSG_SET_NOTIFICATIONS)
                        {
                            node.debug("Result: " + JSON.stringify(msg.result[0]));
                        }
                    }
                    else if (("method" in msg) && ("params" in msg))
                    {
                        if (msg.method in node.subscribers)
                        {
                            node.debug("Event for " + msg.method + " received");

                            node.subscribers[msg.method].forEach(callback =>
                            {
                                callback(msg);
                            });
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
                node.warn("WebSocket connection error: " + error.toString());
            });

            connection.on("close", function()
            {
                node.debug("WebSocket connection closed");
            });

            connection.sendUTF(JSON.stringify(switchNotifications(MSG_GET_NOTIFICATIONS, [], [])));
        }

        function onConnectFailed(error)
        {
            node.warn("WebSocket client connect failed: " + error.toString());
        }

        function connectWebClient(service)
        {
            var client = new WebSocketClient();

            client.on("connect", onConnect);
            client.on("connectFailed", onConnectFailed);

            let url = "ws://" + node.host + ":" + node.port + "/sony/" + service;

            node.debug("Connecting to: " + url);
            client.connect(url);

            return client;
        }

        this.on("close", () =>
        {
            node.connections.forEach(conn =>
            {
                conn.close();
            });
        });

        this.systemClient = connectWebClient("system");
        this.audioClient = connectWebClient("audio");
        this.avContentClient = connectWebClient("avContent");
    }

    RED.nodes.registerType("sony-audio-device", SonyAudioDeviceNode);
}