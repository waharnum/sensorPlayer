(function ($, fluid) {

    "use strict";

    var environment = flock.init();
    environment.start();

    fluid.defaults("fluid.sensorPlayer.simulatedSensor", {
        gradeNames: ["fluid.modelComponent"],
        model: {
            sensorValue: 50,
            simulateChanges: true,
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
            }, 1000);
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
        // addToEnvironment: false,
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
            pHSensor: {
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
            pHSynthesizer: {
                type: "fluid.sensorPlayer.sensorSynthesizer",
                options: {
                    model: {
                        sensorValue: "{pHSensor}.model.sensorValue",
                        sensorUpper: "{pHSensor}.model.sensorUpper",
                        sensorLower: "{pHSensor}.model.sensorLower"
                    }
                }
            },
            pHSensorDisplay: {
                type: "fluid.sensorPlayer.valueDisplay",
                container: ".flc-pHSensorValue",
                options: {
                    model: {
                        value: "{pHSensor}.model.sensorValue"
                    }
                }
            },
            synthFreqDisplay: {
                type: "fluid.sensorPlayer.valueDisplay",
                container: ".flc-freqValue",
                options: {
                    model: {
                        value: "{pHSynthesizer}.model.inputs.carrier.freq"
                    }
                }
            }
        }
    });

})(jQuery, fluid);
