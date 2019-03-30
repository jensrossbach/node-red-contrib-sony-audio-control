module.exports = function(RED)
{
    function SonyAudioEventNode(config)
    {
        RED.nodes.createNode(this, config);
        var node = this;

        this.name = config.name;
        this.event = config.event;

        function handleEvent(response)
        {
            var msg = {method: response.method,
                       version: response.version,
                       payload: (response.params.length == 1) ? response.params[0] : null};

            node.send(msg);
        }

        this.device = RED.nodes.getNode(config.device);
        if (this.device)
        {
            if (this.event == "any")
            {
                this.debug("Subscribing for all events.");
                Object.keys(this.device.subscribers).forEach(key =>
                {
                    this.device.subscribers[key].push(handleEvent);
                });
            }
            else
            {
                this.debug("Subscribing for event " + this.event);
                this.device.subscribers[this.event].push(handleEvent);
            }
        }
    }

    RED.nodes.registerType("sony-audio-event", SonyAudioEventNode);
}