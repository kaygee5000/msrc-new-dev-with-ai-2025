-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: field.msrcghana.org    Database: field_msrcghana_db
-- ------------------------------------------------------
-- Server version	8.0.29

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `right_to_play_question_categories`
--

DROP TABLE IF EXISTS `right_to_play_question_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `right_to_play_question_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` mediumtext COLLATE utf8mb4_unicode_ci,
  `is_valid` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `right_to_play_question_categories`
--

LOCK TABLES `right_to_play_question_categories` WRITE;
/*!40000 ALTER TABLE `right_to_play_question_categories` DISABLE KEYS */;
INSERT INTO `right_to_play_question_categories` VALUES (1,'right_to_play_question_category_d262d973-697d-4fbd-9b8c-136fae942280','School Output Indicators','School Output Indicators',1,NULL,'2024-05-03 07:13:11','2024-05-03 07:13:11'),(2,'right_to_play_question_category_d17fe2dc-36f3-4e65-8cb5-382b8d0f88bf','District Output Indicators','District Output Indicators',1,NULL,'2024-05-03 07:13:11','2024-05-03 07:13:11'),(3,'right_to_play_question_category_3ca81975-b3f8-446b-80ef-a8038db441ca','Out Indicators: Consolidated Checklist','Out Indicators: Consolidated Checklist',1,NULL,'2024-05-03 07:13:11','2024-05-03 07:13:11'),(4,'right_to_play_question_category_058b5e99-d9b7-49c3-861e-2d48baa8c0c0','Out Indicators: Partners in Play Lesson Observation','Out Indicators: Partners in Play Lesson Observation',1,NULL,'2024-05-03 07:13:11','2024-05-03 07:13:11'),(5,'right_to_play_question_category_d2020d2e-7cd0-46e3-a9e7-34feb7e7931f','Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation','Whether the lesson used play-based learning approaches • Whether the lesson provided opportunities for reflect, connect and apply. • Whether the teacher made use of positive discipline approaches.Whether the lesson was gender-responsive in its treatment of boys and girls.',1,NULL,'2024-05-03 07:13:11','2024-05-03 07:13:11');
/*!40000 ALTER TABLE `right_to_play_question_categories` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-17 21:18:17
