/* Store the locale-specific strings */

var UIStrings = (function () {
    "use strict";

    var UIStrings = {};

    // JSON object for English strings
    UIStrings.EN =
    {
        "Actions": "Actions",
        "Start": "Launch",
        "Stop": "Stop"
    };


    // JSON object for Spanish strings
    UIStrings.FR =
    {
        "Actions" : "Actions",
        "Start": "Lancer",
        "Stop": "Arréter"
    };


    UIStrings.getLocaleStrings = function (locale) {
        var text;

        // Get the resource strings that match the language.
        switch (locale) {
            case 'en-US':
                text = UIStrings.EN;
                break;
            case 'fr-FR':
                text = UIStrings.FR;
                break;
            default:
                text = UIStrings.EN;
                break;
        }

        return text;
    };

    return UIStrings;
})();