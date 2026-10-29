# ============================================================
# SMART CFO - RULE ENGINE
# ============================================================


# ============================================================
# 1. PRODUCTION RULES
# ============================================================

rules = [

    {
        "name": "High Liquidity Risk",
        "condition": lambda x: x["current_ratio"] < 1,
        "conclusion": "High Liquidity Risk"
    },

    {
        "name": "Moderate Liquidity Risk",
        "condition": lambda x: 1 <= x["current_ratio"] < 1.5,
        "conclusion": "Moderate Liquidity Risk"
    },

    {
        "name": "High Debt Risk",
        "condition": lambda x: x["debt_to_equity"] > 3,
        "conclusion": "High Debt Risk"
    },

    {
        "name": "Moderate Debt Risk",
        "condition": lambda x: 2 <= x["debt_to_equity"] <= 3,
        "conclusion": "Moderate Debt Risk"
    },

    {
        "name": "High Interest Coverage Risk",
        "condition": lambda x: x["interest_coverage"] < 1.5,
        "conclusion": "High Interest Coverage Risk"
    },

    {
        "name": "High Profitability Risk",
        "condition": lambda x: x["profit_margin"] < 0,
        "conclusion": "High Profitability Risk"
    },

    {
        "name": "Moderate Profitability Risk",
        "condition": lambda x: 0 <= x["profit_margin"] < 5,
        "conclusion": "Moderate Profitability Risk"
    },

    {
        "name": "High Cash Flow Risk",
        "condition": lambda x: x["operating_cash_flow"] < 0,
        "conclusion": "High Cash Flow Risk"
    },

    {
        "name": "High Revenue Growth Risk",
        "condition": lambda x: x["revenue_growth"] < -5,
        "conclusion": "High Revenue Growth Risk"
    },

    {
        "name": "High Profit Growth Risk",
        "condition": lambda x: x["profit_growth"] < -10,
        "conclusion": "High Profit Growth Risk"
    }
]


# ============================================================
# 2. FORWARD CHAINING
# ============================================================

def forward_chaining(financial_data):

    detected_risks = []

    for rule in rules:

        if rule["condition"](financial_data):

            detected_risks.append({
                "rule": rule["name"],
                "conclusion": rule["conclusion"]
            })

    return detected_risks


# ============================================================
# 3. BACKWARD CHAINING
#    WHY IS THIS RISK DETECTED?
# ============================================================

def backward_chaining(financial_data, target):

    explanation = []

    for rule in rules:

        # Find rule that can produce the requested target
        if rule["conclusion"] == target:

            # Check whether the rule condition is satisfied
            if rule["condition"](financial_data):

                if target == "High Liquidity Risk":

                    explanation.append(
                        f"Current Ratio is "
                        f"{financial_data['current_ratio']:.2f}, "
                        f"which is below the threshold of 1."
                    )

                elif target == "Moderate Liquidity Risk":

                    explanation.append(
                        f"Current Ratio is "
                        f"{financial_data['current_ratio']:.2f}, "
                        f"which is between 1 and 1.5."
                    )

                elif target == "High Debt Risk":

                    explanation.append(
                        f"Debt-to-Equity is "
                        f"{financial_data['debt_to_equity']:.2f}, "
                        f"which is above the threshold of 3."
                    )

                elif target == "Moderate Debt Risk":

                    explanation.append(
                        f"Debt-to-Equity is "
                        f"{financial_data['debt_to_equity']:.2f}, "
                        f"which is between 2 and 3."
                    )

                elif target == "High Interest Coverage Risk":

                    explanation.append(
                        f"Interest Coverage is "
                        f"{financial_data['interest_coverage']:.2f}, "
                        f"which is below the threshold of 1.5."
                    )

                elif target == "High Profitability Risk":

                    explanation.append(
                        f"Profit Margin is "
                        f"{financial_data['profit_margin']:.2f}%, "
                        f"which is below 0%."
                    )

                elif target == "Moderate Profitability Risk":

                    explanation.append(
                        f"Profit Margin is "
                        f"{financial_data['profit_margin']:.2f}%, "
                        f"which is between 0% and 5%."
                    )

                elif target == "High Cash Flow Risk":

                    explanation.append(
                        f"Operating Cash Flow is "
                        f"{financial_data['operating_cash_flow']:.2f}, "
                        f"which is negative."
                    )

                elif target == "High Revenue Growth Risk":

                    explanation.append(
                        f"Revenue Growth (QoQ) is "
                        f"{financial_data['revenue_growth']:.2f}%, "
                        f"which is below -5%."
                    )

                elif target == "High Profit Growth Risk":

                    explanation.append(
                        f"Profit Growth (QoQ) is "
                        f"{financial_data['profit_growth']:.2f}%, "
                        f"which is below -10%."
                    )

    return explanation


# ============================================================
# 4. INTELLIGENT RECOMMENDATIONS & RISK DETAILS GENERATOR
# ============================================================

def get_risk_details_and_recommendations(financial_data, target):
    """
    Generates deterministic, explainable risk details, business impact assessment,
    prioritized recommendations, action plan, and monitoring metrics based on actual
    financial data and triggered rules.
    """
    slug = target.lower().replace(" ", "-")
    
    # Defaults
    severity = "High Risk" if "High" in target else "Medium Risk"
    
    if target == "High Liquidity Risk":
        cr = financial_data.get("current_ratio", 0)
        return {
            "slug": slug,
            "severity": "High Risk",
            "category": "Liquidity & Working Capital",
            "metric_name": "Current Ratio",
            "actual_value": f"{cr:.2f}",
            "threshold_display": "< 1.00 (Safe Benchmark: >= 1.50)",
            "potential_impact": "Short-term liabilities exceed current liquid assets. The company faces immediate working capital stress, vendor payment delays, and reliance on emergency short-term credit lines.",
            "recommendations": [
                {
                    "priority": "High",
                    "title": "Working Capital Preservation & Debt Restructuring",
                    "reasoning": f"Current Ratio is {cr:.2f}, which is below the 1.00 solvency threshold.",
                    "metric_threshold": f"Current Ratio ({cr:.2f}) vs Threshold (< 1.00)",
                    "next_steps": [
                        "Negotiate short-term debt repayment extensions or convert short-term facilities to longer-term debt.",
                        "Accelerate accounts receivable collection by offering early payment discounts for overdue invoices.",
                        "Defer non-critical capital expenditures and non-essential operating overheads."
                    ],
                    "monitoring_metric": "Current Ratio (Suggested Benchmark: >= 1.25x), Cash-to-Debt Ratio"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Conduct weekly rolling cash flow forecasting to track net cash burn.",
                    "Review top accounts receivable aging balances and issue payment reminders."
                ],
                "medium_term_actions": [
                    "Renegotiate working capital credit lines with lending partners.",
                    "Implement inventory optimization controls to unlock tied-up cash."
                ]
            },
            "monitoring_metrics": ["Current Ratio", "Quick Ratio", "Operating Cash Flow"]
        }

    elif target == "Moderate Liquidity Risk":
        cr = financial_data.get("current_ratio", 0)
        return {
            "slug": slug,
            "severity": "Medium Risk",
            "category": "Liquidity & Working Capital",
            "metric_name": "Current Ratio",
            "actual_value": f"{cr:.2f}",
            "threshold_display": "1.00 to 1.49 (Safe Benchmark: >= 1.50)",
            "potential_impact": "Working capital cushion is tight. While solvent, unexpected cash flow hiccups or receivables delays could push liquidity into severe risk territory.",
            "recommendations": [
                {
                    "priority": "Medium",
                    "title": "Strengthen Liquidity Buffer & Collectibles Control",
                    "reasoning": f"Current Ratio is {cr:.2f}, remaining below the optimal 1.50 benchmark.",
                    "metric_threshold": f"Current Ratio ({cr:.2f}) vs Healthy Target (>= 1.50)",
                    "next_steps": [
                        "Monitor Days Sales Outstanding (DSO) weekly to prevent receivable aging.",
                        "Optimize inventory reorder thresholds to avoid over-purchasing raw materials."
                    ],
                    "monitoring_metric": "Current Ratio (Suggested Benchmark: >= 1.50x)"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Review aging receivables for accounts older than 45 days."
                ],
                "medium_term_actions": [
                    "Build an operational cash buffer covering at least 60 days of operating expenses."
                ]
            },
            "monitoring_metrics": ["Current Ratio", "Quick Ratio"]
        }

    elif target == "High Debt Risk":
        de = financial_data.get("debt_to_equity", 0)
        eq = financial_data.get("equity", 0)
        is_neg_equity = eq <= 0
        actual_val_str = f"N/A (Equity: ₹{eq:.2f} Cr)" if is_neg_equity else f"{de:.2f}x"
        thresh_str = "Equity <= 0 (Deficit Balance Sheet)" if is_neg_equity else "> 3.00x (Safe Benchmark: <= 2.00x)"
        reason_str = f"Shareholders' equity is negative (₹{eq:.2f} Cr), indicating balance sheet deficit and critical debt leverage." if is_neg_equity else f"Debt-to-Equity is {de:.2f}x, exceeding the 3.00x safety ceiling."
        metric_thresh_str = f"Equity (₹{eq:.2f} Cr) vs Safety Minimum (> ₹0.00 Cr)" if is_neg_equity else f"Debt-to-Equity ({de:.2f}x) vs Safety Threshold (> 3.00x)"

        return {
            "slug": slug,
            "severity": "High Risk",
            "category": "Solvency & Financial Leverage",
            "metric_name": "Debt-to-Equity",
            "actual_value": actual_val_str,
            "threshold_display": thresh_str,
            "potential_impact": "Financial leverage is critically high. High debt service obligations strain operating cash flow and elevate solvency risk during market downturns." if not is_neg_equity else "Shareholders' equity is negative, indicating total liabilities exceed assets. The company is operating under balance sheet insolvency.",
            "recommendations": [
                {
                    "priority": "High",
                    "title": "Capital Structure Deleveraging & Debt Amortization",
                    "reasoning": reason_str,
                    "metric_threshold": metric_thresh_str,
                    "next_steps": [
                        "Prioritize free cash flow allocation toward paying down high-cost short-term and long-term debt.",
                        "Evaluate equity capital injection or debt-to-equity conversion options.",
                        "Freeze new non-essential debt issuances."
                    ],
                    "monitoring_metric": "Debt-to-Equity Ratio (Suggested Benchmark: <= 2.00x)"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Audit debt repayment schedules and interest rates across all debt lines.",
                    "Allocate net operating cash surplus toward debt principal reduction."
                ],
                "medium_term_actions": [
                    "Negotiate debt refinancing to extend maturity dates and reduce interest costs."
                ]
            },
            "monitoring_metrics": ["Debt-to-Equity", "Debt-to-Assets", "Interest Coverage"]
        }

    elif target == "Moderate Debt Risk":
        de = financial_data.get("debt_to_equity", 0)
        return {
            "slug": slug,
            "severity": "Medium Risk",
            "category": "Solvency & Financial Leverage",
            "metric_name": "Debt-to-Equity",
            "actual_value": f"{de:.2f}x",
            "threshold_display": "2.00x to 3.00x (Safe Benchmark: <= 2.00x)",
            "potential_impact": "Leverage is elevated above standard benchmarks. While manageable, rising interest rates or margin dips could increase debt pressure.",
            "recommendations": [
                {
                    "priority": "Medium",
                    "title": "Controlled Leverage Reduction & Cash Allocation",
                    "reasoning": f"Debt-to-Equity is {de:.2f}x, occupying an elevated leverage tier.",
                    "metric_threshold": f"Debt-to-Equity ({de:.2f}x) vs Optimal Level (<= 2.00x)",
                    "next_steps": [
                        "Cap incremental debt funding for expansion projects.",
                        "Use retained earnings to gradually reduce debt ratios."
                    ],
                    "monitoring_metric": "Debt-to-Equity Ratio (Suggested Benchmark: <= 2.00x)"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Check bank debt covenants to ensure compliance margins."
                ],
                "medium_term_actions": [
                    "Strengthen equity base through profit retention."
                ]
            },
            "monitoring_metrics": ["Debt-to-Equity", "Interest Coverage"]
        }

    elif target == "High Interest Coverage Risk":
        ic = financial_data.get("interest_coverage", 0)
        return {
            "slug": slug,
            "severity": "High Risk",
            "category": "Debt Service & Profitability",
            "metric_name": "Interest Coverage",
            "actual_value": f"{ic:.2f}x",
            "threshold_display": "< 1.50x (Safe Benchmark: >= 3.00x)",
            "potential_impact": "Operating profit (EBIT) provides inadequate buffer to cover annual interest obligations. Risk of interest payment default if profits drop.",
            "recommendations": [
                {
                    "priority": "High",
                    "title": "Interest Outlay Reduction & Operating Profit Expansion",
                    "reasoning": f"Interest Coverage ratio is {ic:.2f}x, below the 1.50x safety threshold.",
                    "metric_threshold": f"Interest Coverage ({ic:.2f}x) vs Threshold (< 1.50x)",
                    "next_steps": [
                        "Refinance high-interest credit lines with lower-cost financing options.",
                        "Implement aggressive overhead cost controls to widen EBIT margins.",
                        "Consider divestment of non-core underperforming assets to repay debt."
                    ],
                    "monitoring_metric": "Interest Coverage Ratio (Suggested Benchmark: >= 3.00x)"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Review all active interest schedules and lender contracts.",
                    "Cut non-essential administrative and marketing expenses to preserve EBIT."
                ],
                "medium_term_actions": [
                    "Improve core operating margins to expand EBIT buffer."
                ]
            },
            "monitoring_metrics": ["Interest Coverage", "EBITDA", "Operating Expenses"]
        }

    elif target == "High Profitability Risk":
        pm = financial_data.get("profit_margin", 0)
        return {
            "slug": slug,
            "severity": "High Risk",
            "category": "Profitability & Margin Efficiency",
            "metric_name": "Profit Margin",
            "actual_value": f"{pm:.2f}%",
            "threshold_display": "< 0.00% (Safe Benchmark: >= 10.00%)",
            "potential_impact": "Net profit margin is negative, indicating net operational losses. Continuous losses deplete equity capital reserves and threaten solvency.",
            "recommendations": [
                {
                    "priority": "High",
                    "title": "Margin Turnaround & Cost Restructuring",
                    "reasoning": f"Net Profit Margin is negative ({pm:.2f}%), reflecting unprofitable operations.",
                    "metric_threshold": f"Profit Margin ({pm:.2f}%) vs Threshold (< 0.00%)",
                    "next_steps": [
                        "Perform product/service profitability audit to eliminate negative-margin items.",
                        "Renegotiate vendor supply agreements to lower Cost of Goods Sold (COGS).",
                        "Streamline operating expenses (SG&A) to restore positive net margin."
                    ],
                    "monitoring_metric": "Net Profit Margin (Suggested Benchmark: >= 5.00%)"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Identify top 3 cost drivers causing net operating losses.",
                    "Impose spending controls on discretionary operating categories."
                ],
                "medium_term_actions": [
                    "Realign product pricing structure to absorb input cost increases."
                ]
            },
            "monitoring_metrics": ["Profit Margin", "ROA", "ROE"]
        }

    elif target == "Moderate Profitability Risk":
        pm = financial_data.get("profit_margin", 0)
        return {
            "slug": slug,
            "severity": "Medium Risk",
            "category": "Profitability & Margin Efficiency",
            "metric_name": "Profit Margin",
            "actual_value": f"{pm:.2f}%",
            "threshold_display": "0.00% to 4.99% (Safe Benchmark: >= 10.00%)",
            "potential_impact": "Profit margin is thin. The company has small cushion against input cost inflation, pricing pressures, or revenue fluctuations.",
            "recommendations": [
                {
                    "priority": "Medium",
                    "title": "Margin Expansion & Operational Cost Discipline",
                    "reasoning": f"Profit Margin is {pm:.2f}%, remaining below the healthy 5.00% benchmark.",
                    "metric_threshold": f"Profit Margin ({pm:.2f}%) vs Healthy Benchmark (>= 5.00%)",
                    "next_steps": [
                        "Focus commercial efforts on higher-margin product categories.",
                        "Optimize procurement terms to lower material costs."
                    ],
                    "monitoring_metric": "Net Profit Margin (Suggested Benchmark: >= 10.00%)"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Review gross margins across key customer accounts."
                ],
                "medium_term_actions": [
                    "Improve operational productivity to lower unit cost of goods sold."
                ]
            },
            "monitoring_metrics": ["Profit Margin", "ROA"]
        }

    elif target == "High Cash Flow Risk":
        ocf = financial_data.get("operating_cash_flow", 0)
        return {
            "slug": slug,
            "severity": "High Risk",
            "category": "Cash Flow & Liquidity",
            "metric_name": "Operating Cash Flow",
            "actual_value": f"₹{ocf:.2f} Cr",
            "threshold_display": "< ₹0.00 Cr (Safe Benchmark: > ₹0.00 Cr)",
            "potential_impact": "Core operations are consuming cash rather than generating cash flow. Continual negative cash flow rapidly exhausts cash balances.",
            "recommendations": [
                {
                    "priority": "High",
                    "title": "Operating Cash Flow Recovery & Working Capital Control",
                    "reasoning": f"Operating Cash Flow is negative (₹{ocf:.2f} Cr), indicating operational cash burn.",
                    "metric_threshold": f"Operating Cash Flow (₹{ocf:.2f} Cr) vs Threshold (< ₹0.00 Cr)",
                    "next_steps": [
                        "Enforce strict billing schedules and prompt collection procedures.",
                        "Renegotiate payable terms with non-critical suppliers.",
                        "Tighten inventory procurement to match immediate customer orders."
                    ],
                    "monitoring_metric": "Operating Cash Flow (Suggested Target: Positive OCF)"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Analyze cash conversion cycle components (DSO, DIO, DPO).",
                    "Implement central cash gate approvals for major disbursements."
                ],
                "medium_term_actions": [
                    "Align operational expense budgeting strictly with operating cash receipts."
                ]
            },
            "monitoring_metrics": ["Operating Cash Flow", "Operating Cash Flow Ratio"]
        }

    elif target == "High Revenue Growth Risk":
        rg = financial_data.get("revenue_growth", 0)
        return {
            "slug": slug,
            "severity": "High Risk",
            "category": "Top-Line Revenue & Market Position",
            "metric_name": "Revenue Growth (QoQ)",
            "actual_value": f"{rg:.2f}%",
            "threshold_display": "< -5.00% (Safe Benchmark: > 0.00%)",
            "potential_impact": "Top-line revenue contraction signals market share loss, customer churn, or industry volume decline, eroding top-line scale.",
            "recommendations": [
                {
                    "priority": "High",
                    "title": "Commercial Strategy Realignment & Customer Retention",
                    "reasoning": f"Revenue Growth (QoQ) dropped by {rg:.2f}%, breaching the -5.00% risk threshold.",
                    "metric_threshold": f"Revenue Growth ({rg:.2f}%) vs Threshold (< -5.00%)",
                    "next_steps": [
                        "Investigate churn drivers among key customer accounts.",
                        "Focus sales resources on high-retention client segments.",
                        "Explore new channel partnerships or complementary product offerings."
                    ],
                    "monitoring_metric": "Quarterly Revenue Growth (Suggested Target: > 0.00%)"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Conduct account review meetings with key revenue-contributing clients.",
                    "Analyze price vs volume impact on quarterly sales drop."
                ],
                "medium_term_actions": [
                    "Launch targeted customer re-engagement and sales promotion campaigns."
                ]
            },
            "monitoring_metrics": ["Revenue Growth (QoQ)", "Asset Turnover"]
        }

    elif target == "High Profit Growth Risk":
        pg = financial_data.get("profit_growth", 0)
        return {
            "slug": slug,
            "severity": "High Risk",
            "category": "Earnings Growth & Cost Control",
            "metric_name": "Profit Growth (QoQ)",
            "actual_value": f"{pg:.2f}%",
            "threshold_display": "< -10.00% (Safe Benchmark: > 0.00%)",
            "potential_impact": "Net profit is falling rapidly, outstripping revenue changes and pointing to severe cost inflation or margin compression.",
            "recommendations": [
                {
                    "priority": "High",
                    "title": "Cost Structure Realignment & Earnings Stabilization",
                    "reasoning": f"Profit Growth (QoQ) dropped by {pg:.2f}%, breaching the -10.00% risk threshold.",
                    "metric_threshold": f"Profit Growth ({pg:.2f}%) vs Threshold (< -10.00%)",
                    "next_steps": [
                        "Audit major expense escalations over past quarters.",
                        "Realign pricing models to reflect input cost inflation.",
                        "Optimize headcount and administrative costs."
                    ],
                    "monitoring_metric": "Quarterly Profit Growth (Suggested Target: > 0.00%)"
                }
            ],
            "action_plan": {
                "immediate_actions": [
                    "Conduct operational cost audit to pinpoint margin leakage.",
                    "Identify cost reduction targets across SG&A expense categories."
                ],
                "medium_term_actions": [
                    "Implement cost management controls across business units."
                ]
            },
            "monitoring_metrics": ["Profit Growth (QoQ)", "ROE"]
        }

    return {
        "slug": slug,
        "severity": severity,
        "category": "Financial Risk",
        "metric_name": "Financial Metric",
        "actual_value": "N/A",
        "threshold_display": "Evaluated Rule Condition",
        "potential_impact": "Financial metric triggered rule condition. General monitoring recommended.",
        "recommendations": [
            {
                "priority": "Medium",
                "title": "Review Financial Metrics & Monitor Operating Bounds",
                "reasoning": f"Rule '{target}' triggered based on financial evaluation.",
                "metric_threshold": "Rule Triggered",
                "next_steps": [
                    "Review historical financial trend data for underlying drivers.",
                    "Monitor quarterly balance sheet and income statement metrics."
                ],
                "monitoring_metric": "Key Financial Ratios"
            }
        ],
        "action_plan": {
            "immediate_actions": ["Review financial statements for recent quarter."],
            "medium_term_actions": ["Track financial metrics against operating targets."]
        },
        "monitoring_metrics": ["Current Ratio", "Debt-to-Equity", "Profit Margin"]
    }


# ============================================================
# 4. TEST RULE ENGINE
# ============================================================

if __name__ == "__main__":

    test_data = {

        "current_ratio": 0.8,

        "debt_to_equity": 3.5,

        "interest_coverage": 1.2,

        "profit_margin": 3.0,

        "operating_cash_flow": -10,

        "revenue_growth": -7,

        "profit_growth": -15
    }


    print("=" * 60)
    print("          SMART CFO RULE ENGINE TEST")
    print("=" * 60)


    # ========================================================
    # FORWARD CHAINING TEST
    # ========================================================

    risks = forward_chaining(test_data)

    print("\nFORWARD CHAINING:")
    print("-" * 40)

    if risks:

        for risk in risks:

            print(
                "⚠️",
                risk["conclusion"]
            )

    else:

        print("✅ No risks detected")


    # ========================================================
    # BACKWARD CHAINING TEST
    # ========================================================

    target = "High Debt Risk"

    explanation = backward_chaining(
        test_data,
        target
    )

    print("\nBACKWARD CHAINING:")
    print("-" * 40)

    if explanation:

        for item in explanation:

            print(
                "Why?",
                item
            )

    else:

        print(
            "No rule supports:",
            target
        )


    # ========================================================
    # TEST ALL DETECTED RISKS WITH BACKWARD CHAINING
    # ========================================================

    print("\n" + "=" * 60)
    print("       COMPLETE RISK EXPLANATIONS")
    print("=" * 60)

    if risks:

        for risk in risks:

            target = risk["conclusion"]

            explanation = backward_chaining(
                test_data,
                target
            )

            print(f"\n⚠️ {target}")

            if explanation:

                for reason in explanation:

                    print(
                        "   →",
                        reason
                    )

            else:

                print(
                    "   → No explanation available"
                )

    else:

        print(
            "\n✅ No risks require explanation."
        )