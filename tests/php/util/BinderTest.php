<?php

include_once 'util/binder.inc.php';

/**
 * Class BinderTest
 *
 * @covers Binder
 */
class BinderTest extends PHPUnit_Framework_TestCase
{

    /**
     * @covers Binder::param
     */
    public function testParam()
    {
        $binder = new Binder();

        $params = array();

        $params[] = $binder->param('foo', 5);
        $params[] = $binder->param('foo', 5);
        $params[] = $binder->param('foo', 6);

        $this->assertEquals($params, array_unique($params), 'creates 3 unique parameter names for the same base name');

        $this->assertNull($binder->param('bar', NULL), 'ignores null valued parameters');

        $this->assertRegExp('/\(:\w+\)/', $binder->param('foo', 5), 'returns valid named parameter codes');
    }

    /**
     * @covers Binder::param_keys
     */
    public function testParamKeys()
    {
        $binder = new Binder();

        $this->assertEquals(0, count($binder->param_keys()));

        $binder->param('foo', 5);
        $this->assertEquals(1, count($binder->param_keys()));

        $binder->param('foo', 5);
        $this->assertEquals(2, count($binder->param_keys()));

        $binder->param('foo', 6, PDO::PARAM_INT);
        $this->assertEquals(3, count($binder->param_keys()));
    }

    /**
     * When no parameters are bound, does nothing.
     *
     * @covers Binder::bind
     */
    public function testBind_withNoParams()
    {
        $binder = new Binder();

        //Mock a PDOStatement object
        $pdo_stmt = $this->getMock('PDOStatement', array('bindValue'));

        //Expect no bindings
        $pdo_stmt->expects($this->never())
            ->method('bindValue');

        $this->assertSame($pdo_stmt, $binder->bind($pdo_stmt));
    }

    /**
     * Binds non-null-valued parameters, using STR as the default type.
     *
     * @covers Binder::bind
     */
    public function testBind_withParams()
    {
        $binder = new Binder();

        $binder->param('foo', 5);
        $binder->param('bar', NULL, PDO::PARAM_BOOL);
        $binder->param('asdf', '65', PDO::PARAM_INT);

        //Mock a PDOStatement object
        $pdo_stmt = $this->getMock('PDOStatement', array('bindValue'));

        //once with ('foo-0', 5, PDO::PARAM_STR)
        $pdo_stmt->expects($this->at(0))
            ->method('bindValue')
            ->with($this->stringStartsWith('foo'),
                $this->equalTo(5),
                $this->equalTo(PDO::PARAM_STR)) //DEFAULT PARAMETER TYPE
            ->will($this->returnValue(TRUE));

        //and once with ('asdf-1', '65', PDO::PARAM_INT)
        $pdo_stmt->expects($this->at(1))
            ->method('bindValue')
            ->with($this->stringStartsWith('asdf'),
                $this->equalTo('65'),
                $this->equalTo(PDO::PARAM_INT))
            ->will($this->returnValue(TRUE));

        //Expects to be called twice.
        $pdo_stmt->expects($this->exactly(2))
            ->method('bindValue');

        $this->assertSame($pdo_stmt, $binder->bind($pdo_stmt));
    }

    /**
     * Fails out of binding when there is an error, or when the statement is invalid.
     *
     * @covers Binder::bind
     */
    public function testBind_withFailure()
    {
        $binder = new Binder();

        $binder->param('foo', 5);
        $binder->param('asdf', '65', PDO::PARAM_INT);

        //Mock a PDOStatement object
        $pdo_stmt = $this->getMock('PDOStatement', array('bindValue'));

        //once with ('foo-0', 5, PDO::PARAM_STR)
        $pdo_stmt->expects($this->once())
            ->method('bindValue')
            ->with($this->stringStartsWith('foo'),
                $this->equalTo(5),
                $this->equalTo(PDO::PARAM_STR))
            ->will($this->returnValue(FALSE)); //FAILURE!!!

        //Expects to be called once.
        $pdo_stmt->expects($this->exactly(1))
            ->method('bindValue');

        $this->assertNull($binder->bind($pdo_stmt));
    }
}
