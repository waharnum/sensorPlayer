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

    fluid.defaults("fluid.sensorPlayer.sensorSynthesizer", {
        gradeNames: ["flock.modelSynth"],
        model: {
            inputs: {
                carrier: {
                    freq: null
                }
            },
            freqUpper: 450,
            freqLower: 300,
            sensorUpper: 100,
            sensorLower: 0,
            sensorValue: 50
        },
        synthDef: {
            id: "carrier",
            ugen: "flock.ugen.sin",
            freq: 300
        },
        addToEnvironment: true,
        modelListeners: {
            sensorValue: {
                funcName: "fluid.sensorPlayer.sensorSynthesizer.relaySensorValue",
                args: ["{that}", "{that}.model.sensorValue"]
            }
        }
    });

    fluid.sensorPlayer.sensorSynthesizer.relaySensorValue = function(that, sensorValue) {
        var freqUpper = that.model.freqUpper,
            freqLower = that.model.freqLower,
            sensorUpper = that.model.sensorUpper,
            sensorLower = that.model.sensorLower;

        var freq = fluid.sensorPlayer.sensorSynthesizer.scaleValue(sensorValue, sensorLower, sensorUpper, freqLower, freqUpper);

        that.applier.change("inputs.carrier.freq", freq);
    };

    fluid.sensorPlayer.sensorSynthesizer.scaleValue = function (value, inputLower, inputUpper, outputLower, outputUpper) {
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
        gradeNames: ["fluid.component"],
        components: {
            sensor: {
                type: "fluid.sensorPlayer.simulatedSensor",
                options: {
                    model: {
                        sensorValue: 7,
                        simulateChanges: true,
                        sensorUpper: 14,
                        sensorLower: 1
                    }
                }

            },
            sensorSynthesizer: {
                type: "fluid.sensorPlayer.sensorSynthesizer",
                options: {
                    model: {
                        sensorValue: "{sensor}.model.sensorValue",
                        sensorUpper: "{sensor}.model.sensorUpper",
                        sensorLower: "{sensor}.model.sensorLower"
                    },
                    addToEnvironment: false
                }
            },
            sensorDisplay: {
                type: "fluid.sensorPlayer.valueDisplay",
                container: ".flc-pHSensorValue",
                options: {
                    model: {
                        value: "{sensor}.model.sensorValue"
                    },
                    members: {
                        template: "<p><strong>pH Sensor Value:</strong> <span class=\"flc-valueDisplay-value\"></span></p>"
                    }
                }
            },
            synthFreqDisplay: {
                type: "fluid.sensorPlayer.valueDisplay",
                container: ".flc-pHFreqValue",
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

})(jQuery, fluid);
