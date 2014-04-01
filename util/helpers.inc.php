<?php

class Helpers
{

    private static $powers = array(
        array(1e12, 1e12, ' trillion', 'T'),
        array(1e9, 1e9, ' billion', 'B'),
        array(1e6, 1e6, ' million', 'M'),
        array(1e4, 1e3, ' thousand', 'K'), // only use thousands if over 10k
        array(1, 1, '', '')
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
        if ($number < 1 && $number > 0) {
            return strval($number);
        }

        // Find the first power that is <= the number
        $power = 1;
        $label = '';
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

        $number = sprintf('%.1f', $number / $power);
        if ($number == round($number)) {
            $number = sprintf('%.0f', $number);
        }

        return $number . $label;
    }

    /**
     * Generate a friendly datetime string.
     *
     * @param DateTime $datetime
     * @return string
     */
    public static function friendly_date($datetime) {
        return $datetime->format('m/d/Y g:i A');
    }
} 