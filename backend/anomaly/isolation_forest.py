import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler


def fit_predict_isolation_forest(X: pd.DataFrame, contamination: float = 0.10):
    """
    Runs scikit-learn Isolation Forest model on prepared numerical features.
    Returns boolean array is_anomaly and float array decision_scores.
    """
    if X.empty:
        return np.array([]), np.array([])

    imputer = SimpleImputer(strategy="median")
    X_imp = imputer.fit_transform(X)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imp)

    # Contamination threshold handling
    n_samples = len(X)
    actual_contamination = contamination if n_samples >= 10 else 0.15

    clf = IsolationForest(
        n_estimators=200,
        contamination=actual_contamination,
        random_state=42
    )

    preds = clf.fit_predict(X_scaled)  # -1 for outlier, 1 for normal
    raw_scores = clf.decision_function(X_scaled)  # Lower is more anomalous

    is_anomaly = preds == -1
    return is_anomaly, raw_scores
