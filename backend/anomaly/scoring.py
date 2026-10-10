import pandas as pd
import numpy as np
from .feature_engineering import FEATURE_METADATA
from .explanations import generate_parameter_explanation


def compute_historical_deviations(df: pd.DataFrame, feature_cols: list) -> list:
    """
    Computes feature-level historical medians and z-scores / IQR deviations for each record row.
    Calculates parameter-specific text explanations for every feature.
    """
    medians = df[feature_cols].median()
    q25 = df[feature_cols].quantile(0.25)
    q75 = df[feature_cols].quantile(0.75)
    iqr = (q75 - q25).replace(0, 1e-5)

    all_row_deviations = []

    for idx, row in df.iterrows():
        quarter = str(row["quarter"])
        row_deviations = []

        for col in feature_cols:
            val = float(row[col])
            med = float(medians[col])
            iqr_val = float(iqr[col])
            dev_score = abs(val - med) / iqr_val if iqr_val > 0 else 0.0
            diff_abs = val - med
            diff_pct = ((val - med) / abs(med)) * 100.0 if med != 0 else 0.0

            prev_val = float(df.iloc[idx - 1][col]) if idx > 0 else None
            is_unusual = bool(dev_score > 1.5)

            meta = FEATURE_METADATA[col]
            param_exp = generate_parameter_explanation(
                feature_key=col,
                feature_label=meta["label"],
                unit=meta["unit"],
                actual_val=val,
                prev_val=prev_val,
                median_val=med,
                abs_diff=diff_abs,
                pct_diff=diff_pct,
                is_unusual=is_unusual,
                quarter=quarter
            )

            row_deviations.append({
                "feature_key": col,
                "feature_label": meta["label"],
                "unit": meta["unit"],
                "category": meta["category"],
                "actual_value": round(val, 2),
                "previous_value": round(prev_val, 2) if prev_val is not None else None,
                "historical_median": round(med, 2),
                "absolute_diff": round(diff_abs, 2),
                "percent_diff": round(diff_pct, 1),
                "deviation_severity": round(dev_score, 2),
                "is_unusual": is_unusual,
                "status": "Unusual Trend Detected" if is_unusual else "Normal Baseline Range",
                "parameter_explanation": param_exp
            })

        # Sort by deviation severity
        sorted_devs = sorted(row_deviations, key=lambda x: x["deviation_severity"], reverse=True)
        all_row_deviations.append(sorted_devs)

    return all_row_deviations
