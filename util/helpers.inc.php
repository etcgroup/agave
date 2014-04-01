<?php

class Helpers
{

    private static $powers = array(
        array(1e12, 1e12, '%.1f trillion', '%.1fT'),
        array(1e9, 1e9, '%.1f billion', '%.1fB'),
        array(1e6, 1e6, '%.1f million', '%.1fM'),
        array(1e4, 1e3, '%.1f thousand', '%.1fK'), // only use thousands if over 10k
        array(1, 1, '%f', '%f')
    );

    /**
     * Converts a biggish number into a printable format that
     * is easier to read.
     *
     * Numbers above 10,000 will be converted into
     * numbers like 12.2 thousand, 2.4 million, etc.
     *
     * Set $abbrev to TRUE to use 12K, 2.4M, etc.
     *
     * @param $number
     * @param bool $abbrev
     * @return string
     */
    public static function friendly_bignum($number, $abbrev = FALSE)
    {
        // Find the first power that is <= the number
        $power = 1;
        $label = '%f';
        foreach (self::$powers as $level) {
            if ($level[0] <= $number) {
                $power = $level[1];

                if ($abbrev) {
                    $label = $level[3];
                } else {
                    $label = $level[2];
                }

                break;
            }
        }

        $number = $number / $power;
        return sprintf($label, $number);
    }
} 