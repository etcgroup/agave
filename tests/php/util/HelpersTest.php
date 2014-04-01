<?php

include_once 'util/helpers.inc.php';

class HelpersTest extends PHPUnit_Framework_TestCase {


    public function test_friendly_bignum()
    {
        $this->assertEquals(Helpers::friendly_bignum(0), '0');
        $this->assertEquals(Helpers::friendly_bignum(0.23), '0.23');
        $this->assertEquals(Helpers::friendly_bignum(1), '1');
        $this->assertEquals(Helpers::friendly_bignum(1.45), '1.45');
        $this->assertEquals(Helpers::friendly_bignum(92), '92');
        $this->assertEquals(Helpers::friendly_bignum(920), '920');
        $this->assertEquals(Helpers::friendly_bignum(1234), '1234');
        $this->assertEquals(Helpers::friendly_bignum(24231), '24.2 thousand');
        $this->assertEquals(Helpers::friendly_bignum(423523), '423.5 thousand');
        $this->assertEquals(Helpers::friendly_bignum(1224353), '1.2 million');
        $this->assertEquals(Helpers::friendly_bignum(23634353), '23.6 million');
        $this->assertEquals(Helpers::friendly_bignum(953524353), '953.5 million');
        $this->assertEquals(Helpers::friendly_bignum(2953524353), '3.0 billion');
        $this->assertEquals(Helpers::friendly_bignum(29213524353), '29.2 billion');
        $this->assertEquals(Helpers::friendly_bignum(294585243534), '294.6 billion');
        $this->assertEquals(Helpers::friendly_bignum(1000000000000), '1.0 trillion');
        $this->assertEquals(Helpers::friendly_bignum(2513463567283), '2.5 trillion');
        $this->assertEquals(Helpers::friendly_bignum(25634635672834), '25.6 trillion');
        $this->assertEquals(Helpers::friendly_bignum(546924635672834), '546.9 trillion');
    }

    public function test_friendly_bignum_abbrev()
    {
        $this->assertEquals(Helpers::friendly_bignum(0, TRUE), '0');
        $this->assertEquals(Helpers::friendly_bignum(1, TRUE), '1');
        $this->assertEquals(Helpers::friendly_bignum(92, TRUE), '92');
        $this->assertEquals(Helpers::friendly_bignum(24231, TRUE), '24.2K');
        $this->assertEquals(Helpers::friendly_bignum(1224353, TRUE), '1.2M');
        $this->assertEquals(Helpers::friendly_bignum(2953524353, TRUE), '3.0B');
        $this->assertEquals(Helpers::friendly_bignum(25634635672834, TRUE), '25.6T');
    }
}
 