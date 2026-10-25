import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "build"))

from official_profiles import OFFICIAL_PROFILES, largest_remainder


class OfficialProfileTests(unittest.TestCase):
    def test_every_profile_has_a_complete_integer_quota(self):
        for code, profile in OFFICIAL_PROFILES.items():
            with self.subTest(code=code):
                self.assertEqual(sum(profile["quota"].values()), profile["question_count"])
                self.assertEqual(set(profile["quota"]), {domain["id"] for domain in profile["domains"]})
                self.assertTrue(all(value > 0 for value in profile["quota"].values()))

    def test_largest_remainder_is_deterministic(self):
        domains = [{"id": "a", "weight": 33.1}, {"id": "b", "weight": 33.1}, {"id": "c", "weight": 33.8}]
        self.assertEqual(largest_remainder(53, domains), {"a": 18, "b": 17, "c": 18})


if __name__ == "__main__":
    unittest.main()
