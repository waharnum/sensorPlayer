(function ($, fluid) {

    "use strict";

    var environment = flock.init();
    environment.start();

    fluid.defaults("fluid.sensorPlayer.simulatedSensor", {
        gradeNames: ["fluid.modelComponent"],
        model: {
            sensorValue: 50,
            simulateChanges: true,
            simulateChangesInterval: 1000,
            sensorUpper: 100,
            sensorLower: 0
        },
        members: {
            simulateChangesIntervalId: null
        },
        modelListeners: {
            sensorValue: {
                "this": "console",
                "method": "log",
                "args": "{that}.model.sensorValue"
            },
            simulateChanges: {
                "funcName": "fluid.sensorPlayer.simulatedSensor.simulateChanges",
                "args": ["{that}", "{that}.model.simulateChanges"]
            }
        }
    });

    fluid.sensorPlayer.simulatedSensor.randomInt = function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    };

    fluid.defaults("fluid.sensorPlayer.simulatedSensor.pHSensor", {
        gradeNames: ["fluid.sensorPlayer.simulatedSensor"],
        model: {
            sensorValue: 7,
            sensorUpper: 14,
            sensorLower: 1
        }
    });

    fluid.sensorPlayer.simulatedSensor.simulateChanges = function(that, simulateChanges) {

        if(simulateChanges) {
            // Turn on the interval changes to the sensorValue
            that.simulateChangesIntervalId = setInterval(function() {
                that.applier.change("sensorValue", fluid.sensorPlayer.simulatedSensor.randomInt(that.model.sensorUpper, that.model.sensorLower));
            }, that.model.simulateChangesInterval);
        } else {
            // Turn off the interval changes to the sensorValue
            clearInterval(that.simulateChangesIntervalId);
        }
    };

    // A sensor synthesizer that translates a lower and upper bounded
    // sensor into lower or higher frequencies
    fluid.defaults("fluid.sensorPlayer.sensorScalingSynthesizer", {
        gradeNames: ["flock.modelSynth"],
        model: {
            freqUpper: 650,
            freqLower: 250,
            sensorUpper: 100,
            sensorLower: 0,
            sensorValue: 50
        },
        synthDef: [
            {
            id: "carrier",
            ugen: "flock.ugen.sin",
            inputs: {
                freq: 440
                }
            },
            {
            id: "midpoint",
            ugen: "flock.ugen.sin",
            inputs: {
                freq: 440,
                mul: 0.25
                }
            }
        ],
        addToEnvironment: true,
        modelListeners: {
            sensorValue: {
                funcName: "fluid.sensorPlayer.sensorScalingSynthesizer.relaySensorValue",
                args: ["{that}", "{that}.model.sensorValue"]
            }
        }
    });

    fluid.sensorPlayer.sensorScalingSynthesizer.relaySensorValue = function(that, sensorValue) {
        var freqUpper = that.model.freqUpper,
            freqLower = that.model.freqLower,
            sensorUpper = that.model.sensorUpper,
            sensorLower = that.model.sensorLower;

        var freq = fluid.sensorPlayer.sensorScalingSynthesizer.scaleValue(sensorValue, sensorLower, sensorUpper, freqLower, freqUpper);
        var midpointFreq = fluid.sensorPlayer.sensorScalingSynthesizer.getMidpointValue(freqUpper, freqLower);

        that.applier.change("inputs.carrier.freq", freq);
        that.applier.change("inputs.midpoint.freq", midpointFreq);
    };

    fluid.sensorPlayer.sensorScalingSynthesizer.getMidpointValue = function(upper, lower) {
        return (upper + lower) / 2;
    };

    fluid.sensorPlayer.sensorScalingSynthesizer.scaleValue = function (value, inputLower, inputUpper, outputLower, outputUpper) {
        var scaledValue = ((outputUpper - outputLower) * (value - inputLower) / (inputUpper - inputLower)) + outputLower;
        return scaledValue;

    };

    fluid.defaults("fluid.sensorPlayer.valueDisplay", {
        gradeNames: ["fluid.viewComponent"],
        model: {
            value: "Hello, World!"
        },
        members: {
            template: "<p class=\"flc-valueDisplay-value\"></p>"
        },
        selectors: {
            value: ".flc-valueDisplay-value"
        },
        listeners: {
            "onCreate.appendTemplate": {
                "this": "{that}.container",
                "method": "html",
                "args": "{that}.template"
            },
            "onCreate.setInitialValue": {
                "this": "{that}.dom.value",
                "method": "html",
                "args": ["{that}.model.value"]
            },
        },
        modelListeners: {
            value: {
                "this": "{that}.dom.value",
                "method": "html",
                "args": ["{that}.model.value"]
            }
        }
    });

    fluid.defaults("fluid.sensorPlayer", {
        gradeNames: ["fluid.viewComponent"],
        events: {
            displayTemplateReady: null
        },
        selectors: {
            sensorValueDisplay: ".flc-sensorValue",
            synthFreqDisplay: ".flc-freqValue"
        },
        members: {
            template: '<div class="flc-sensorValue"></div><div class="flc-freqValue"></div>'
        },
        listeners: {
            "onCreate.appendDisplayTemplate": {
                "this": "{that}.container",
                "method": "html",
                "args": "{that}.template"
            },
            "onCreate.fireDisplayTemplateReady": {
                func: "{that}.events.displayTemplateReady.fire"
            }
        },
        components: {
            sensor: {
                type: "fluid.sensorPlayer.simulatedSensor",
                options: {
                    model: {
                        simulateChanges: true,
                    }
                }
            },
            sensorSynthesizer: {
                type: "fluid.sensorPlayer.sensorScalingSynthesizer",
                options: {
                    model: {
                        sensorValue: "{sensor}.model.sensorValue",
                        sensorUpper: "{sensor}.model.sensorUpper",
                        sensorLower: "{sensor}.model.sensorLower"
                    },
                    addToEnvironment: true
                }
            },
            sensorDisplay: {
                createOnEvent: "{sensorPlayer}.events.displayTemplateReady",
                type: "fluid.sensorPlayer.valueDisplay",
                container: "{sensorPlayer}.dom.sensorValueDisplay",
                options: {
                    model: {
                        value: "{sensor}.model.sensorValue"
                    },
                    members: {
                        template: "<p><strong>Sensor Value:</strong> <span class=\"flc-valueDisplay-value\"></span></p>"
                    }
                }
            },
            synthFreqDisplay: {
                createOnEvent: "{sensorPlayer}.events.displayTemplateReady",
                type: "fluid.sensorPlayer.valueDisplay",
                container: "{sensorPlayer}.dom.synthFreqDisplay",
                options: {
                    model: {
                        value: "{sensorSynthesizer}.model.inputs.carrier.freq"
                    },
                    members: {
                        template: "<p><strong>Synthesizer frequency:</strong> <span class=\"flc-valueDisplay-value\"></span></p>"
                    }
                }
            }
        }
    });

    fluid.defaults("fluid.sensorPlayer.pHSensorPlayer", {
        gradeNames: ["fluid.sensorPlayer"],
        components: {
            sensor: {
                type: "fluid.sensorPlayer.simulatedSensor.pHSensor"
            }
        }
    });

})(jQuery, fluid);
