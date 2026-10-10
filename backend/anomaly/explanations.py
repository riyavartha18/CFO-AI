def generate_parameter_explanation(
    feature_key: str,
    feature_label: str,
    unit: str,
    actual_val: float,
    prev_val: float | None,
    median_val: float,
    abs_diff: float,
    pct_diff: float,
    is_unusual: bool,
    quarter: str
) -> str:
    """
    Generates a concise, parameter-specific natural language explanation
    strictly derived from actual financial comparisons.
    """
    if not is_unusual:
        pct_text = f"{abs(pct_diff):.1f}%"
        direction = "higher than" if pct_diff >= 0 else "lower than"
        return (
            f"{feature_label} was {actual_val:,.2f} {unit} in {quarter}, which is {pct_text} {direction} "
            f"its historical baseline ({median_val:,.2f} {unit}). This metric remains within standard historical bounds."
        )

    # Unusual Parameter Explanations categorized by financial metric type
    direction = "increased" if pct_diff > 0 else "decreased"
    magnitude = f"{abs(pct_diff):.1f}%"
    comp_text = f"compared with the historical baseline ({actual_val:,.2f} {unit} vs median {median_val:,.2f} {unit})"

    if "expense" in feature_key or feature_key in ["cogs", "operating_expenses", "interest_expense", "tax_expense", "total_expenses"]:
        if pct_diff > 0:
            return (
                f"{feature_label} increased by {magnitude} {comp_text}. "
                f"This surge is substantially larger than the company's historical expense pattern, marking this parameter as an unusual trend."
            )
        else:
            return (
                f"{feature_label} declined by {magnitude} {comp_text}. "
                f"This cost reduction represents a noticeable deviation from historical expense baselines."
            )

    elif feature_key in ["revenue", "operating_profit", "operating_profit_margin", "revenue_growth"]:
        if pct_diff < 0:
            return (
                f"{feature_label} declined by {magnitude} {comp_text}. "
                f"This top-line drop deviates significantly from typical historical performance levels."
            )
        else:
            return (
                f"{feature_label} rose sharply by {magnitude} {comp_text}. "
                f"This rapid top-line growth is substantially above typical historical quarterly levels."
            )

    elif "cash" in feature_key:
        if actual_val < 0:
            return (
                f"{feature_label} dropped to a negative {actual_val:,.2f} {unit} in {quarter} ({comp_text}). "
                f"This negative cash movement represents an unusual operational liquidity contraction."
            )
        else:
            return (
                f"{feature_label} shifted by {pct_diff:+.1f}% {comp_text}. "
                f"This cash flow pattern differs noticeably from the company's historical cash flow baseline."
            )

    elif "debt" in feature_key:
        return (
            f"{feature_label} shifted by {pct_diff:+.1f}% {comp_text}. "
            f"This leverage adjustment is substantially outside the company's typical debt range."
        )

    else:
        return (
            f"{feature_label} shifted by {pct_diff:+.1f}% {comp_text}. "
            f"This movement represents an unusual historical pattern for this parameter."
        )


def generate_multivariate_summary(quarter: str, is_anom: bool, decision_score: float, unusual_params: list) -> str:
    """
    Generates summary explanation for a quarterly record.
    """
    if not is_anom:
        return f"Quarter {quarter} exhibits standard financial metrics consistent with historical baselines."

    if unusual_params:
        param_names = [p["feature_label"] for p in unusual_params[:3]]
        return (
            f"Isolation Forest flagged quarter {quarter} (decision score: {decision_score:.4f}) due to unusual "
            f"parameter trends in: {', '.join(param_names)}."
        )
    else:
        return (
            f"Isolation Forest flagged quarter {quarter} (decision score: {decision_score:.4f}) due to an unusual "
            f"multivariate combination across financial metrics, though individual parameters remain near normal baselines."
        )
