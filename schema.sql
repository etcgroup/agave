delimiter $$

CREATE TABLE IF NOT EXISTS `annotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `user` varchar(150) NOT NULL,
  `label` varchar(150) NOT NULL,
  `time` datetime NOT NULL,
  `public` int(1) unsigned NOT NULL DEFAULT '1',
  `corpus` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `public_time` (`public`,`time`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4$$

CREATE TABLE IF NOT EXISTS `discussions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `public` int(1) unsigned NOT NULL DEFAULT '1',
  `corpus` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `public` (`public`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4$$

CREATE TABLE IF NOT EXISTS `instrumentation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `time` datetime NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `action` varchar(45) NOT NULL,
  `user` varchar(150) DEFAULT NULL,
  `data` varchar(250) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `public` int(10) unsigned NOT NULL DEFAULT '1',
  `corpus` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4$$

CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discussion_id` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `user` varchar(150) NOT NULL,
  `message` varchar(1000) NOT NULL,
  `view_state` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created` (`created`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4$$

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(32) NOT NULL,
  `access` INT UNSIGNED NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8$$

CREATE TABLE IF NOT EXISTS `app_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `last_signed_in` datetime DEFAULT NULL,
  `twitter_id` bigint(20) unsigned DEFAULT NULL,
  `screen_name` varchar(100) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `utc_offset` int(11) DEFAULT NULL,
  `time_zone` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_twitter_id` (`twitter_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4$$

CREATE TABLE IF NOT EXISTS `corpora` (
  `id` varchar(45) NOT NULL,
  `name` varchar(150) NOT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8$$

