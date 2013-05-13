define(['util/strings'], function(strings) {

    describe('Strings utilities', function() {

        it("can shorten a long string with ellipses", function() {
            //Length = 28
            var long_string = "I am a very very long string";

            //The max length is very large
            expect(strings.snippet(long_string, 200)).toBe(long_string);

            //Cut off the last word
            expect(strings.snippet(long_string, 27)).toBe("I am a very very long...");

            //Check the boundaries
            expect(strings.snippet(long_string, 8)).toBe("I am...");
            expect(strings.snippet(long_string, 9)).toBe("I am a...");
        });

    });
});