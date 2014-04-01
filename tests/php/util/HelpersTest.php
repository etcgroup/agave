<?php

include_once 'util/helpers.inc.php';

class HelpersTest extends PHPUnit_Framework_TestCase {


    public function test_friendly_bignum()
    {
        $this->assertSame('0', Helpers::friendly_bignum(0));
        $this->assertSame('0', Helpers::friendly_bignum('0'));
        $this->assertSame('0.23', Helpers::friendly_bignum(0.23));
        $this->assertSame('1', Helpers::friendly_bignum(1));
        $this->assertSame('1.5', Helpers::friendly_bignum(1.46));
        $this->assertSame('92', Helpers::friendly_bignum(92));
        $this->assertSame('920', Helpers::friendly_bignum(920));
        $this->assertSame('1234', Helpers::friendly_bignum(1234));
        $this->assertSame('24.2 thousand', Helpers::friendly_bignum(24231));
        $this->assertSame('423.5 thousand', Helpers::friendly_bignum(423523));
        $this->assertSame('1.2 million', Helpers::friendly_bignum(1224353));
        $this->assertSame('23.6 million', Helpers::friendly_bignum(23634353));
        $this->assertSame('953.5 million', Helpers::friendly_bignum(953524353));
        $this->assertSame('3 billion', Helpers::friendly_bignum(2953524353));
        $this->assertSame('29.2 billion', Helpers::friendly_bignum(29213524353));
        $this->assertSame('294.6 billion', Helpers::friendly_bignum(294585243534));
        $this->assertSame('1 trillion', Helpers::friendly_bignum(1000000000000));
        $this->assertSame('2.5 trillion', Helpers::friendly_bignum(2513463567283));
        $this->assertSame('25.6 trillion', Helpers::friendly_bignum(25634635672834));
        $this->assertSame('546.9 trillion', Helpers::friendly_bignum(546924635672834));
    }

    public function test_friendly_bignum_abbrev()
    {
        $this->assertSame('0', Helpers::friendly_bignum(0, TRUE));
        $this->assertSame('1', Helpers::friendly_bignum(1, TRUE));
        $this->assertSame('92', Helpers::friendly_bignum(92, TRUE));
        $this->assertSame('24.2K', Helpers::friendly_bignum(24231, TRUE));
        $this->assertSame('1.2M', Helpers::friendly_bignum(1224353, TRUE));
        $this->assertSame('3B', Helpers::friendly_bignum(2953524353, TRUE));
        $this->assertSame('25.6T', Helpers::friendly_bignum(25634635672834, TRUE));
    }
}
 