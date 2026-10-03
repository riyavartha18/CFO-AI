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
                        f"Revenue Growth is "
                        f"{financial_data['revenue_growth']:.2f}%, "
                        f"which is below -5%."
                    )

                elif target == "High Profit Growth Risk":

                    explanation.append(
                        f"Profit Growth is "
                        f"{financial_data['profit_growth']:.2f}%, "
                        f"which is below -10%."
                    )

    return explanation


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