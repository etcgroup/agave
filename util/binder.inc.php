<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

/**
 * Class Binder
 *
 * For tracking and binding parameters in prepared statements.
 */
class Binder
{

    public $param_map = array();

    /**
     * Adds a new parameter. Base name is a prefix for the parameter's name,
     * good to use in case the queries need to be debugged.
     *
     * @param $baseName
     * @param $value
     * @param int $type
     * @return mixed
     */
    public function param($baseName, $value = NULL, $type = PDO::PARAM_STR)
    {
        if ($value === NULL) {
            return NULL;
        }

        $paramsSize = count($this->param_map);
        $param = "{$baseName}_{$paramsSize}";
        $this->param_map[$param] = array($value, $type);
        return "(:$param)";
    }

    public function grouped_created_at_params($start_datetime, $stop_datetime, $group_seconds=5) {
        if ($group_seconds !== 5) {
            throw new Exception("Group seconds must be 5!");
        }


        $start_datetime = $start_datetime->getTimestamp() / $group_seconds;
        $stop_datetime = $stop_datetime->getTimestamp() / $group_seconds;

        $start_datetime = $this->param('from', $start_datetime, PDO::PARAM_INT);
        $stop_datetime = $this->param('to', $stop_datetime, PDO::PARAM_INT);

        return array($start_datetime, $stop_datetime, $group_seconds);
    }

    /**
     * Get the keys for the parameters.
     *
     * @return array
     */
    public function param_keys()
    {
        return array_keys($this->param_map);
    }

    /**
     * Binds the declared parameters to the prepared statement.
     * @param PDOStatement $stmt
     * @return mixed
     */
    public function bind($stmt)
    {
        if (!$stmt) {
            return NULL;
        }

        //Bind all the parameters
        foreach ($this->param_map as $paramName => $pair) {
            $value = $pair[0];
            $type = $pair[1];

            if (!$stmt->bindValue($paramName, $value, $type)) {
                return NULL;
            }
        }

        return $stmt;
    }


}