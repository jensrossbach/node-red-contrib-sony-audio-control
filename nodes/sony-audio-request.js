module.exports = function(RED)
{
    const request = require("request-promise");

    function SonyAudioRequestNode(config)
    {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.device = RED.nodes.getNode(config.device);

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
                                        params: msg.payload}};

                    request(req).then(response =>
                    {
                        if ("result" in response)
                        {
                            let respMsg = {service: msg.service,
                                           method: msg.method,
                                           version: msg.version,
                                           payload: (response.result.length == 1) ? response.result[0] : null};

                            this.send([respMsg, null]);
                        }
                        else if ("error" in response)
                        {
                            let respMsg = {service: msg.service,
                                           method: msg.method,
                                           version: msg.version,
                                           payload: {error: response.error[0],
                                                     description: response.error[1]}};

                            this.send([null, respMsg]);
                        }
                    }).catch(error =>
                    {
                        let respMsg = {service: msg.service,
                                       method: msg.method,
                                       version: msg.version,
                                       payload: error};

                        this.send([null, respMsg]);
                    });
                }
                else
                {
                    // just forward the message to the error output
                    this.send([null, msg]);
                }
            });
        }
    }

    RED.nodes.registerType("sony-audio-request", SonyAudioRequestNode);
}