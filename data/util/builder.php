<?php

class Builder
{
    private $_conditions = array();
    private $_selects = array();
    private $_froms = array();
    private $_joins = array();
    private $_groupings = array();
    private $_orderings = array();
    private $_limit = NULL;

    public $name;

    /**
     * @param string $name
     */
    public function __construct($name)
    {
        $this->name = $name;
    }

    /**
     * Convert to SQL string.
     *
     * @return string
     */
    public function sql()
    {
        $parts = array();

        if (count($this->_selects)) {
            $selects = implode(",\n  ", $this->_selects);
            $parts[] = "SELECT {$selects}";
        }

        if (count($this->_froms)) {
            $froms = implode(",\n  ", $this->_froms);
            $parts[] = "FROM {$froms}";
        }

        if (count($this->_joins)) {
            $parts = array_merge($parts, $this->_joins);
        }

        if (count($this->_conditions)) {
            $conditions = implode("\n  AND ", $this->_conditions);
            $parts[] = "WHERE {$conditions}";
        }

        if (count($this->_groupings)) {
            $groupings = implode(', ', $this->_groupings);
            $parts[] = "GROUP BY {$groupings}";
        }

        if (count($this->_orderings)) {
            $orderings = implode(', ', $this->_orderings);
            $parts[] = "ORDER BY {$orderings}";
        }

        if ($this->_limit !== NULL) {
            $parts[] = $this->_limit;
        }

        return implode("\n", $parts);
    }

    public function where($field, $op, $param = NULL)
    {
        if ($param === NULL) {
            return NULL;
        }

        $condition = "$field $op $param";
        $this->_conditions[] = $condition;

        return $condition;
    }

    public function where_created_at_between($fromParam, $toParam, $table = 'tweets')
    {
        $this->where("$table.created_at", '<', $toParam);
        $this->where("$table.created_at", '>=', $fromParam);
    }

    public function where_retweet_count_over($minRTParam, $table = 'tweets')
    {
        $this->where("$table.retweet_count", '>=', $minRTParam);
    }

    public function where_is_retweet_is($isRTParam, $table = 'tweets')
    {
        $this->where("$table.is_retweet", '=', $isRTParam);
    }

    public function where_sentiment_is($sentimentParam, $table = 'tweets') {
        $this->where("$table.sentiment", '=', $sentimentParam);
    }

    public function where_user_is($userIdParam, $table = 'tweets') {
        $this->where("$table.user_id", '=', $userIdParam);
    }

    public function where_text_like($searchParam, $table = 'tweets')
    {
        $this->where("$table.text", 'LIKE', $searchParam);
    }

    public function select($selectString)
    {
        $this->_selects[] = $selectString;
    }

    public function from($fromString)
    {
        $this->_froms[] = $fromString;
    }

    /**
     * Join against another table on the given condition.
     * Defaults to inner join.
     *
     * @param $against
     * @param $condition
     * @param string $type
     */
    public function join($against, $condition, $type = '')
    {
        $this->_joins[] = "$type JOIN $against ON $condition";
    }

    /**
     * Order by some field, defaults to ascending order.
     *
     * @param null $field
     * @param string $direction
     */
    public function order_by($field = NULL, $direction = '')
    {
        if ($field === NULL) {
            return;
        }

        $this->_orderings[] = trim("$field $direction");
    }

    public function group_by($field = NULL)
    {
        if ($field === NULL) {
            return;
        }

        $this->_groupings[] = $field;
    }

    public function limit($count = NULL, $offset = 0)
    {
        if ($count === NULL) {
            return;
        }

        $this->_limit = "LIMIT $offset, $count";
    }
}

