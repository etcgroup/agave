<?php

include_once 'util/builder.inc.php';

/**
 * Class BuilderTest
 *
 * @covers Builder
 */
class BuilderTest extends PHPUnit_Framework_TestCase {

    /**
     * @covers Builder::__construct
     */
    public function testConstructor()
    {
        $builder = new Builder('my_name');

        $this->assertEquals('my_name', $builder->name);
    }

    /**
     * @covers Builder::sql
     */
    public function testSql_empty() {
        $builder = new Builder('my_name');

        $sql = $builder->sql();
        $this->assertEmpty($sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::select
     */
    public function testSql_select() {
        $builder = new Builder('my_name');

        $builder->select('NOW()');
        $builder->select('5');

        $sql = $builder->sql();
        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT NOW(), 5', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::from
     */
    public function testSql_from() {
        $builder = new Builder('my_name');

        $builder->select('*');
        $builder->from('my_table');
        $builder->from('another as a');

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT * FROM my_table, another as a', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::where
     */
    public function testSql_where() {
        $builder = new Builder('my_name');

        $builder->select('*');
        $builder->from('my_table');
        $builder->where('my_table.foo', '=', 5);
        $builder->where('my_table.bar', '>', 'NOW()');

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT * FROM my_table WHERE my_table.foo = 5 AND my_table.bar > NOW()', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::where
     */
    public function testSql_where_null() {
        $builder = new Builder('my_name');

        $builder->select('*');
        $builder->from('my_table');
        $builder->where('my_table.foo', 'IS', 'NULL');
        $builder->where('my_table.bar', '>', NULL);

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT * FROM my_table WHERE my_table.foo IS NULL', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::join
     */
    public function testSql_join() {
        $builder = new Builder('my_name');

        $builder->select('*');
        $builder->from('my_table');
        $builder->join('another', 'another.id = my_table.a_id');
        $builder->join('third', 'third.id = my_table.t_id', 'LEFT');

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT * FROM my_table JOIN another ON another.id = my_table.a_id LEFT JOIN third ON third.id = my_table.t_id', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::order_by
     */
    public function testSql_order_by() {
        $builder = new Builder('my_name');

        $builder->select('*');
        $builder->from('my_table');
        $builder->order_by('my_table.date');
        $builder->order_by('my_table.id', 'DESC');

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT * FROM my_table ORDER BY my_table.date, my_table.id DESC', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::order_by
     */
    public function testSql_order_by_null() {
        $builder = new Builder('my_name');

        $builder->select('*');
        $builder->from('my_table');
        $builder->order_by('my_table.date');
        $builder->order_by(NULL);

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT * FROM my_table ORDER BY my_table.date', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::group_by
     */
    public function testSql_group_by() {
        $builder = new Builder('my_name');

        $builder->select('my_table.date, my_table.name, COUNT(*)');
        $builder->from('my_table');
        $builder->group_by('my_table.date');
        $builder->group_by('my_table.name');

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT my_table.date, my_table.name, COUNT(*) FROM my_table GROUP BY my_table.date, my_table.name', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::group_by
     */
    public function testSql_group_by_null() {
        $builder = new Builder('my_name');

        $builder->select('my_table.date, my_table.name, COUNT(*)');
        $builder->from('my_table');
        $builder->group_by('my_table.date');
        $builder->group_by(NULL);

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT my_table.date, my_table.name, COUNT(*) FROM my_table GROUP BY my_table.date', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::limit
     */
    public function testSql_limit() {
        $builder = new Builder('my_name');

        $builder->select('*');
        $builder->from('my_table');
        $builder->limit(10);

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT * FROM my_table LIMIT 0, 10', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::limit
     */
    public function testSql_limit_offset() {
        $builder = new Builder('my_name');

        $builder->select('*');
        $builder->from('my_table');
        $builder->limit(10, 4);

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT * FROM my_table LIMIT 4, 10', $sql);
    }

    /**
     * @covers Builder::sql
     * @covers Builder::limit
     */
    public function testSql_limit_null() {
        $builder = new Builder('my_name');

        $builder->select('*');
        $builder->from('my_table');
        $builder->limit(NULL);

        $sql = $builder->sql();

        //Filter the whitespace
        $sql = preg_replace('/\s+/m', ' ', $sql);

        $this->assertEquals('SELECT * FROM my_table', $sql);
    }
}
