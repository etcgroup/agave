delimiter $$

CREATE TABLE `burst_keywords` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `mid_point` datetime NOT NULL,
  `window_size` int(11) NOT NULL,
  `before_total_words` int(11) NOT NULL,
  `after_total_words` int(11) NOT NULL,
  `term` varchar(32) NOT NULL,
  `before_count` int(11) NOT NULL,
  `after_count` int(11) NOT NULL,
  `count_delta` int(11) NOT NULL,
  `count_percent_delta` float NOT NULL,
  `before_rate` float NOT NULL,
  `after_rate` float NOT NULL,
  `rate_delta` float NOT NULL,
  `rate_percent_delta` float NOT NULL,
  `before_relevance` float NOT NULL,
  `after_relevance` float NOT NULL,
  `relevance_delta` float NOT NULL,
  `relevance_percent_delta` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=28539 DEFAULT CHARSET=utf8$$

delimiter $$

CREATE TABLE `tweets` (
  `id` bigint(20) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `in_reply_to_status_id` bigint(20) unsigned DEFAULT NULL,
  `in_reply_to_user_id` int(11) DEFAULT NULL,
  `retweet_of_status_id` bigint(20) DEFAULT NULL,
  `text` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `followers_count` int(11) NOT NULL,
  `friends_count` int(11) NOT NULL,
  `sentiment` int(11) DEFAULT NULL,
  `is_retweet` tinyint(1) NOT NULL,
  `is_reply` tinyint(1) NOT NULL,
  `conversation_id` int(10) unsigned DEFAULT NULL,
  `depth` int(11) unsigned DEFAULT NULL,
  `retweet_count` int(11) NOT NULL,
  `child_count` int(11) DEFAULT NULL,
  `created_at_5s` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `created_at` (`created_at`),
  KEY `is_retweet` (`is_retweet`),
  KEY `is_reply` (`is_reply`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sentiment` (`sentiment`),
  KEY `retweet_count` (`retweet_count`),
  KEY `created_at_5s` (`created_at_5s`),
  KEY `filters_users` (`is_retweet`,`created_at_5s`,`user_id`),
  KEY `filters` (`is_retweet`,`created_at_5s`,`sentiment`,`retweet_count`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8$$


delimiter $$

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `screen_name` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `utc_offset` int(11) DEFAULT NULL,
  `lang` varchar(15) DEFAULT NULL,
  `time_zone` varchar(150) DEFAULT NULL,
  `statuses_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8$$

delimiter $$

CREATE TABLE `corpus_info` (
  `id` varchar(45) NOT NULL,
  `description` varchar(250) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4$$

