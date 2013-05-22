define(['underscore', 'util/strings'], function (_, strings) {

    /**
     * A collection of utilities for managing references to application
     * entities.
     */
    var references = {};

    //Templates for generating reference codes.
    var REFERENCE_TEMPLATES = {
        annotation: _.template("A<%=id%>[<%=snippet(label, 25)%>]"),
        tweet: _.template("T<%=id%>[<%=snippet(text, 25)%>]")
    };

    /**
     * Create a plain-text code for a reference,
     * given a reference type (annotation or tweet)
     * and its data.
     *
     * @param type
     * @param referenceData
     * @returns {*}
     */
    references.build = function (type, referenceData) {
        //add in some helpers
        referenceData = _.extend({
            snippet: strings.snippet
        }, referenceData);
        return REFERENCE_TEMPLATES[type](referenceData);
    };

    var tr = {};
    //See https://raw.github.com/twitter/twitter-text-java/master/src/com/twitter/Regex.java
    tr.LATIN_ACCENTS_CHARS = "\\u00c0-\\u00d6\\u00d8-\\u00f6\\u00f8-\\u00ff" + // Latin-1
        "\\u0100-\\u024f" + // Latin Extended A and B
        "\\u0253\\u0254\\u0256\\u0257\\u0259\\u025b\\u0263\\u0268\\u026f\\u0272\\u0289\\u028b" + // IPA Extensions
        "\\u02bb" + // Hawaiian
        "\\u0300-\\u036f" + // Combining diacritics
        "\\u1e00-\\u1eff"; // Latin Extended Additional (mostly for Vietnamese)
    tr.ALPHA_CHARS = "a-z" + tr.LATIN_ACCENTS_CHARS +
        "\\u0400-\\u04ff\\u0500-\\u0527" +  // Cyrillic
        "\\u2de0-\\u2dff\\ua640-\\ua69f" +  // Cyrillic Extended A/B
        "\\u0591-\\u05bf\\u05c1-\\u05c2\\u05c4-\\u05c5\\u05c7" +
        "\\u05d0-\\u05ea\\u05f0-\\u05f4" + // Hebrew
        "\\ufb1d-\\ufb28\\ufb2a-\\ufb36\\ufb38-\\ufb3c\\ufb3e\\ufb40-\\ufb41" +
        "\\ufb43-\\ufb44\\ufb46-\\ufb4f" + // Hebrew Pres. Forms
        "\\u0610-\\u061a\\u0620-\\u065f\\u066e-\\u06d3\\u06d5-\\u06dc" +
        "\\u06de-\\u06e8\\u06ea-\\u06ef\\u06fa-\\u06fc\\u06ff" + // Arabic
        "\\u0750-\\u077f\\u08a0\\u08a2-\\u08ac\\u08e4-\\u08fe" + // Arabic Supplement and Extended A
        "\\ufb50-\\ufbb1\\ufbd3-\\ufd3d\\ufd50-\\ufd8f\\ufd92-\\ufdc7\\ufdf0-\\ufdfb" + // Pres. Forms A
        "\\ufe70-\\ufe74\\ufe76-\\ufefc" + // Pres. Forms B
        "\\u200c" +                        // Zero-Width Non-Joiner
        "\\u0e01-\\u0e3a\\u0e40-\\u0e4e" + // Thai
        "\\u1100-\\u11ff\\u3130-\\u3185\\uA960-\\uA97F\\uAC00-\\uD7AF\\uD7B0-\\uD7FF" + // Hangul (Korean)
        "\\p{InHiragana}\\p{InKatakana}" +  // Japanese Hiragana and Katakana
        "\\p{InCJKUnifiedIdeographs}" +     // Japanese Kanji / Chinese Han
        "\\u3003\\u3005\\u303b" +           // Kanji/Han iteration marks
        "\\uff21-\\uff3a\\uff41-\\uff5a" +  // full width Alphabet
        "\\uff66-\\uff9f" +                 // half width Katakana
        "\\uffa1-\\uffdc";                  // half width Hangul (Korean)
    tr.ALPHA_NUMERIC_CHARS = "0-9\\uff10-\\uff19_" + tr.ALPHA_CHARS;
    tr.ALPHA = "[" + tr.ALPHA_CHARS + "]";
    tr.ALPHA_NUMERIC = "[" + tr.ALPHA_NUMERIC_CHARS + "]";
    tr.TEXT = "[^\\]]";

    tr.VALID_REFERENCE = new RegExp(
        //Not a letter/number
        "(^|[^" + tr.ALPHA_NUMERIC_CHARS + "])" +
            //either A or T
            "([AT])" +
            //Some digits
            "(\\d+)" +
            //A message in brackets
            "\\[(" + tr.TEXT + "*)\\]" +
            //Not a letter or number
            "(?=$|[^" + tr.ALPHA_NUMERIC_CHARS + "])",
        "ig"
    );
    tr.VALID_REFERENCE_GROUP_BEFORE = 1;
    tr.VALID_REFERENCE_GROUP_TYPE = 2;
    tr.VALID_REFERENCE_GROUP_ID = 3;
    tr.VALID_REFERENCE_GROUP_TEXT = 4;
    tr.VALID_REFERENCE_GROUP_AFTER = 5;

    tr.REFERENCE_REPLACEMENT = "$" + tr.VALID_REFERENCE_GROUP_BEFORE +
        "<span " +
        "class='ref type-$" + tr.VALID_REFERENCE_GROUP_TYPE + "' " +
        "data-id='$" + tr.VALID_REFERENCE_GROUP_ID + "'>" +
        "$" + tr.VALID_REFERENCE_GROUP_TEXT +
        "</span>";

    /**
     * Replaces any reference codes in the message text
     * with HTML entities that can be linked to the rest
     * of the application.
     *
     * @param messageText
     * @returns {*}
     */
    references.replace = function (messageText) {
        var match;

        messageText = messageText.replace(tr.VALID_REFERENCE, tr.REFERENCE_REPLACEMENT);

        return messageText;
    };


    return references;
});