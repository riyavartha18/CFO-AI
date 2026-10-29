"""
SMART CFO — REVENUE FORECASTING MODULE
Re-exports from api.forecasting for dedicated module access.
"""

from api.forecasting import (
    generate_company_revenue_forecast,
    calculate_yoy_growth,
    generate_four_quarter_forecast,
    classify_forecast_trend,
    validate_historical_data,
    parse_quarter,
    format_quarter,
    fetch_company_revenue_records,
)

__all__ = [
    "generate_company_revenue_forecast",
    "calculate_yoy_growth",
    "generate_four_quarter_forecast",
    "classify_forecast_trend",
    "validate_historical_data",
    "parse_quarter",
    "format_quarter",
    "fetch_company_revenue_records",
]
