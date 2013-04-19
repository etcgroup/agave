<?php

include_once 'performance.php';

class Request {

    private $request = NULL;
    private $performance = NULL;

    public function __construct()
    {

    }

    /**
     * Get a performance timer for this request.
     * @return Performance
     */
    public function timing()
    {
        $this->performance = new Performance();
        return $this->performance;
    }

    /**
     * Print the response
     *
     * @param mixed $payload
     * @param Performance $performance
     */
    public function response($payload)
    {
        $response = array(
            'payload' => $payload
        );

        if ($this->request !== NULL)
        {
            $response['request'] = $this->request;
        }

        if ($this->performance !== NULL)
        {
            $response['performance'] = $this->performance;
        }

        header('Content-type: application/json');
        echo json_encode($response);
    }

    /**
     * Collects GET request parameters.
     *
     * @param array $required The required parameters
     * @param array $optional The optional parameters (optional)
     * @return type
     */
    public function get($required, $optional = array())
    {
        $request = array();
        foreach ($required as $param_name)
        {
            if (array_key_exists($param_name, $_GET))
            {
                $request[$param_name] = $_GET[$param_name];
            }
            else
            {
                throw new Exception("Parameter $param_name is required");
            }
        }

        foreach ($optional as $param_name)
        {
            if (array_key_exists($param_name, $_GET))
            {
                $request[$param_name] = $_GET[$param_name];
            }
            else
            {
                $request[$param_name] = NULL;
            }
        }

        $this->request = (object) $request;

        return $this->request;
    }

    public function timeParameters() {
        $params = $this->get(array('from', 'to'));

        $from = (int) ($params->from / 1000);
        $to = (int) ($params->to / 1000);

        return (object) array(
            'from' => new DateTime("@$from"),
            'to' => new DateTime("@$to"),
        );
    }

    public function binnedTimeParams()
    {
        $bundle = $this->timeParameters();

        $params = $this->get(array('interval'));
        $interval = (int) ($params->interval / 1000);

        if ($interval == 0)
            $interval = 1;

        $bundle->interval = (int)$interval;

        return $bundle;
    }

}
