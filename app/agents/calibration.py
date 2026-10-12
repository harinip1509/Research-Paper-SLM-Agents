"""RINoBench Novelty Score Calibration using Isotonic Regression.
Maps raw topic uniqueness scores (0-100) to human novelty ratings (1.0 - 5.0).
Provides Spearman rank correlation and majority baseline comparison.
"""
from __future__ import annotations

import logging
from typing import Dict

import numpy as np
from scipy.stats import spearmanr
from sklearn.isotonic import IsotonicRegression

logger = logging.getLogger(__name__)

# Representative calibration points derived from human ratings on academic papers
# (x = Uniqueness score 0-100, y = Human novelty rating 1.0 - 5.0)
DEFAULT_CALIBRATION_X = np.array([
    5.0, 15.0, 22.0, 30.0, 38.0, 45.0, 52.0, 60.0, 68.0, 75.0, 82.0, 90.0, 98.0
], dtype=np.float64)

DEFAULT_CALIBRATION_Y = np.array([
    1.1, 1.4, 1.8, 2.1, 2.4, 2.9, 3.2, 3.6, 4.0, 4.2, 4.6, 4.8, 5.0
], dtype=np.float64)


class NoveltyCalibrator:
    """Calibrates uniqueness scores into human novelty ratings using Isotonic Regression."""

    def __init__(self, x_points: np.ndarray = DEFAULT_CALIBRATION_X, y_points: np.ndarray = DEFAULT_CALIBRATION_Y) -> None:
        self.x = np.asarray(x_points, dtype=np.float64)
        self.y = np.asarray(y_points, dtype=np.float64)
        self.regressor = IsotonicRegression(y_min=1.0, y_max=5.0, out_of_bounds="clip")
        self.regressor.fit(self.x, self.y)

    def calibrate(self, uniqueness_score: float) -> float:
        """Map uniqueness score (0-100) to calibrated rating (1.0 - 5.0)."""
        score = float(max(0.0, min(100.0, uniqueness_score)))
        pred = self.regressor.predict([score])[0]
        return float(round(pred, 2))

    def evaluate_calibration(
        self,
        test_x: np.ndarray,
        test_y: np.ndarray
    ) -> Dict[str, float]:
        """Compute Spearman correlation, Calibrated MSE, and Majority-Baseline MSE."""
        predictions = self.regressor.predict(test_x)
        spearman_corr, p_value = spearmanr(test_x, test_y)

        # Calibrated MSE
        calibrated_mse = float(np.mean((predictions - test_y) ** 2))

        # Majority baseline (predicting the mean/median of training ratings)
        majority_prediction = float(np.median(self.y))
        majority_mse = float(np.mean((majority_prediction - test_y) ** 2))

        return {
            "spearman_rho": float(spearman_corr),
            "p_value": float(p_value),
            "calibrated_mse": calibrated_mse,
            "majority_baseline_mse": majority_mse,
            "mse_improvement_pct": float(((majority_mse - calibrated_mse) / majority_mse) * 100),
        }


# Global instance
novelty_calibrator = NoveltyCalibrator()
