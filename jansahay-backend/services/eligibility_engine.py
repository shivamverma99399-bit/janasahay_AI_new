"""
Eligibility and Scheme Matchmaker Engine
Provides deterministic matching of users to government schemes based on demographic criteria.
Keep all business logic clean, typed, and well-commented. No AI, LLM, or external APIs are used.
"""

from typing import Any, Dict, List, Tuple, Union


def check_age(user_age: int, min_age: Any, max_age: Any) -> Tuple[bool, str]:
    """
    Checks if the user's age satisfies the scheme's age requirements.
    
    Args:
        user_age: The age of the user.
        min_age: The minimum age required (can be None, int, or float).
        max_age: The maximum age allowed (can be None, int, or float).
        
    Returns:
        A tuple of (is_eligible, reason_string).
    """
    # Coerce to integer if possible, handle exceptions gracefully
    parsed_min: Union[int, None] = None
    parsed_max: Union[int, None] = None
    
    if min_age is not None:
        try:
            parsed_min = int(float(min_age))
        except (ValueError, TypeError):
            pass
            
    if max_age is not None:
        try:
            parsed_max = int(float(max_age))
        except (ValueError, TypeError):
            pass

    # No restriction if both bounds are None
    if parsed_min is None and parsed_max is None:
        return True, "Age meets requirement (No age restriction)"

    if parsed_min is not None and user_age < parsed_min:
        return False, f"Age {user_age} is below the minimum age of {parsed_min}"
        
    if parsed_max is not None and user_age > parsed_max:
        return False, f"Age {user_age} is above the maximum age of {parsed_max}"

    # Satisfied scenarios
    if parsed_min is not None and parsed_max is not None:
        return True, f"Age {user_age} matches requirement ({parsed_min} - {parsed_max} years)"
    elif parsed_min is not None:
        return True, f"Age {user_age} satisfies requirement (Min age: {parsed_min})"
    else:
        return True, f"Age {user_age} satisfies requirement (Max age: {parsed_max})"


def check_income(user_income: float, income_min: Any, income_max: Any) -> Tuple[bool, str]:
    """
    Checks if the user's income satisfies the scheme's income requirements.
    
    Args:
        user_income: The annual income of the user.
        income_min: The minimum income required (can be None, float, or int).
        income_max: The maximum income allowed (can be None, float, or int).
        
    Returns:
        A tuple of (is_eligible, reason_string).
    """
    parsed_min: Union[float, None] = None
    parsed_max: Union[float, None] = None
    
    if income_min is not None:
        try:
            parsed_min = float(income_min)
        except (ValueError, TypeError):
            pass
            
    if income_max is not None:
        try:
            parsed_max = float(income_max)
        except (ValueError, TypeError):
            pass

    # No restriction if both bounds are None
    if parsed_min is None and parsed_max is None:
        return True, "Income satisfies requirement (No income restriction)"

    if parsed_min is not None and user_income < parsed_min:
        return False, f"Income ₹{user_income:,.0f} is below the minimum required of ₹{parsed_min:,.0f}"
        
    if parsed_max is not None and user_income > parsed_max:
        return False, f"Income ₹{user_income:,.0f} exceeds the maximum allowed of ₹{parsed_max:,.0f}"

    # Satisfied scenarios
    if parsed_min is not None and parsed_max is not None:
        return True, f"Income ₹{user_income:,.0f} satisfies requirement (₹{parsed_min:,.0f} - ₹{parsed_max:,.0f})"
    elif parsed_min is not None:
        return True, f"Income ₹{user_income:,.0f} satisfies requirement (Min income: ₹{parsed_min:,.0f})"
    else:
        return True, f"Income satisfies requirement (Below limit of ₹{parsed_max:,.0f})"


def check_gender(user_gender: str, scheme_gender: Any) -> Tuple[bool, str]:
    """
    Checks if the user's gender matches the scheme's target gender.
    
    Args:
        user_gender: The gender of the user.
        scheme_gender: The gender required by the scheme.
        
    Returns:
        A tuple of (is_eligible, reason_string).
    """
    if scheme_gender is None:
        return True, "Gender matches (No gender restriction)"
        
    scheme_gender_str = str(scheme_gender).strip()
    
    # Universal options
    if scheme_gender_str.lower() in ["all", "any", "universal", "universal/all", "both"]:
        return True, "Gender matches (Open to all genders)"
        
    if user_gender.strip().lower() == scheme_gender_str.lower():
        return True, f"Gender matches ({user_gender.title()})"
        
    return False, f"Scheme is restricted to {scheme_gender_str.title()} (user is {user_gender.title()})"


def check_state(user_state: str, scheme_state: Any) -> Tuple[bool, str]:
    """
    Checks if the user's state of residence matches the scheme's supported states.
    
    Args:
        user_state: The state of the user.
        scheme_state: The state required by the scheme.
        
    Returns:
        A tuple of (is_eligible, reason_string).
    """
    if scheme_state is None:
        return True, "State supported (No state restriction)"
        
    scheme_state_str = str(scheme_state).strip()
    
    # Universal / Central options
    if scheme_state_str.lower() in ["all", "any", "central", "universal", "all states"]:
        return True, "State supported (Open to all states)"
        
    if user_state.strip().lower() == scheme_state_str.lower():
        return True, f"State matches ({user_state.title()})"
        
    return False, f"Scheme is restricted to state: {scheme_state_str.title()} (user is in {user_state.title()})"


def check_occupation(user_occupation: str, scheme_occupation: Any) -> Tuple[bool, str]:
    """
    Checks if the user's occupation matches the scheme's eligible occupations.
    
    Args:
        user_occupation: The occupation of the user.
        scheme_occupation: The occupation required by the scheme.
        
    Returns:
        A tuple of (is_eligible, reason_string).
    """
    if scheme_occupation is None:
        return True, "Occupation eligible (No occupation restriction)"
        
    scheme_occ_str = str(scheme_occupation).strip()
    
    # Universal options
    if scheme_occ_str.lower() in ["all", "any", "universal", "others", "open"]:
        return True, "Occupation eligible (Open to all occupations)"
        
    user_occ_lower = user_occupation.strip().lower()
    scheme_occ_lower = scheme_occ_str.lower()
    
    # Split scheme occupations by comma for multi-value checks
    allowed_occs = [o.strip() for o in scheme_occ_lower.split(",") if o.strip()]
    
    # Direct match, substring match or list match
    if user_occ_lower in allowed_occs or any(o in user_occ_lower for o in allowed_occs) or any(user_occ_lower in o for o in allowed_occs):
        return True, f"Occupation matches ({user_occupation.title()})"
        
    return False, f"Occupation {user_occupation.title()} is not eligible"


def check_education(user_education: str, scheme_education: Any) -> Tuple[bool, str]:
    """
    Checks if the user's education level matches or satisfies the scheme requirements.
    
    Args:
        user_education: The education level of the user.
        scheme_education: The education level required by the scheme.
        
    Returns:
        A tuple of (is_eligible, reason_string).
    """
    if scheme_education is None:
        return True, "Education satisfies requirement (No education restriction)"
        
    scheme_edu_str = str(scheme_education).strip()
    
    # Universal options
    if scheme_edu_str.lower() in ["all", "any", "universal", "none"]:
        return True, "Education satisfies requirement"
        
    user_edu_lower = user_education.strip().lower()
    scheme_edu_lower = scheme_edu_str.lower()
    
    # Simple direct matching or containment check
    if user_edu_lower == scheme_edu_lower or user_edu_lower in scheme_edu_lower or scheme_edu_lower in user_edu_lower:
        return True, f"Education matches ({user_education})"
        
    return False, f"Education {user_education} does not meet requirement of {scheme_edu_str}"


def calculate_match_score(results: Dict[str, bool]) -> int:
    """
    Calculates a weighted match score based on individual check results.
    
    Weights configuration:
    - Income check: 25 points
    - Occupation check: 20 points
    - State check: 20 points
    - Age check: 15 points
    - Gender check: 10 points
    - Education check: 10 points
    
    Total maximum points: 100
    
    Args:
        results: A dictionary mapping check names to boolean results.
        
    Returns:
        An integer match score between 0 and 100.
    """
    weights = {
        "income": 25,
        "occupation": 20,
        "state": 20,
        "age": 15,
        "gender": 10,
        "education": 10
    }
    
    score = 0
    for key, weight in weights.items():
        if results.get(key, False):
            score += weight
            
    return score


def match_user_with_schemes(user: Dict[str, Any], schemes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Compares the user profile against a list of schemes and calculates compatibility.
    
    Args:
        user: The user profile dictionary (may contain extra_demographics).
        schemes: A list of scheme dictionaries fetched from Supabase.
        
    Returns:
        A list of results, with match metadata injected, sorted by eligible first and match_score descending.
    """
    matched_results = []
    
    # Extract user profile demographics with fallbacks
    user_age = int(user.get("age", 0))
    user_income = float(user.get("income", 0.0))
    user_gender = str(user.get("gender", "")).strip().lower()
    user_state = str(user.get("state", "")).strip()
    user_occupation = str(user.get("occupation", "")).strip().lower()
    user_education = str(user.get("education", "")).strip().lower()
    
    # Get extra demographics sent from the frontend
    extra = user.get("extra_demographics") or {}
    user_category = str(extra.get("category", "General")).strip().lower()
    user_disability = str(extra.get("disabilityStatus", "No")).strip().lower()
    user_girl_child = str(extra.get("girl_child", "No")).strip().lower()
    user_land = str(extra.get("land", "No")).strip().lower()
    user_household = str(extra.get("household", "")).strip()
    user_district = str(extra.get("district", "")).strip()

    # Rule mappings for known schemes in the database
    SCHEME_RULES = {
        "PM Kisan Samman Nidhi": {
            "occupation": ["farmer"],
            "land_required": True,
            "explanation": "farmer with land ownership"
        },
        "Post-Matric Scholarship": {
            "occupation": ["student"],
            "income_max": 250000.0,
            "explanation": "student with income below 2.5 LPA"
        },
        "National Scholarship Portal": {
            "occupation": ["student"],
            "explanation": "student status verified"
        },
        "AICTE Pragati Scholarship": {
            "occupation": ["student"],
            "gender": ["female"],
            "explanation": "female student"
        },
        "AICTE Saksham Scholarship": {
            "occupation": ["student"],
            "disability": "yes",
            "explanation": "differently-abled student"
        },
        "PM YASASVI Scholarship": {
            "occupation": ["student"],
            "income_max": 250000.0,
            "explanation": "student with income below 2.5 LPA"
        },
        "Kisan Credit Card": {
            "occupation": ["farmer"],
            "explanation": "farmer status verified"
        },
        "Pradhan Mantri Fasal Bima Yojana": {
            "occupation": ["farmer"],
            "explanation": "farmer status verified"
        },
        "Soil Health Card Scheme": {
            "occupation": ["farmer"],
            "land_required": True,
            "explanation": "farmer with cultivable land"
        },
        "PM Mudra Yojana": {
            "exclude_occupation": ["student", "retired"],
            "explanation": "entrepreneur/business owner status"
        },
        "Stand-Up India": {
            "exclude_occupation": ["student", "retired"],
            "female_or_sc_st": True,
            "explanation": "women or SC/ST entrepreneur"
        },
        "Startup India": {
            "exclude_occupation": ["student", "retired"],
            "explanation": "entrepreneur status"
        },
        "PMEGP": {
            "age_min": 18,
            "exclude_occupation": ["student", "retired"],
            "explanation": "entrepreneur above 18 years"
        },
        "Atal Pension Yojana": {
            "age_min": 18,
            "age_max": 40,
            "explanation": "age between 18 and 40 years"
        },
        "Sukanya Samriddhi Yojana": {
            "girl_child": "yes",
            "explanation": "parent of a girl child under 10 years"
        },
        "Beti Bachao Beti Padhao": {
            "girl_child_or_female": True,
            "explanation": "girl child or female beneficiary"
        },
        "PM Kaushal Vikas Yojana": {
            "age_min": 15,
            "age_max": 45,
            "exclude_occupation": ["retired"],
            "explanation": "youth/working age seeker"
        },
        "National Career Service": {
            "exclude_occupation": ["retired"],
            "explanation": "active job seeker"
        },
        "E-Shram": {
            "age_min": 16,
            "age_max": 59,
            "exclude_occupation": ["student", "retired"],
            "explanation": "unorganized worker in working age"
        },
        "Ayushman Bharat PM-JAY": {
            "income_max": 300000.0,
            "explanation": "household income below 3 LPA"
        }
    }
    
    for scheme in schemes:
        name = scheme.get("scheme_name", "")
        # Find matching rule key
        rule = None
        for rule_key, r_val in SCHEME_RULES.items():
            if rule_key.lower() in name.lower() or name.lower() in rule_key.lower():
                rule = r_val
                break
        
        reasons = []
        failed_checks = []
        
        # State Check
        state_pass, state_reason = check_state(user_state, scheme.get("state"))
        if state_pass:
            reasons.append("State matches")
        else:
            failed_checks.append(f"Restricted to state {scheme.get('state')}")
            
        if rule:
            # Age Check
            age_min = rule.get("age_min")
            age_max = rule.get("age_max")
            if age_min is not None and user_age < age_min:
                failed_checks.append(f"Age is below minimum of {age_min}")
            elif age_max is not None and user_age > age_max:
                failed_checks.append(f"Age exceeds maximum of {age_max}")
            elif age_min is not None or age_max is not None:
                reasons.append("Age criteria satisfied")
                
            # Income Check
            income_max = rule.get("income_max")
            if income_max is not None and user_income > income_max:
                failed_checks.append(f"Income exceeds limit of ₹{income_max:,.0f}")
            elif income_max is not None:
                reasons.append("Income criteria satisfied")
                
            # Occupation Check
            req_occ = rule.get("occupation")
            exc_occ = rule.get("exclude_occupation")
            if req_occ and user_occupation not in req_occ:
                failed_checks.append(f"{req_occ[0].title()} status required")
            elif exc_occ and user_occupation in exc_occ:
                failed_checks.append(f"Not eligible for {user_occupation.title()} status")
            elif req_occ or exc_occ:
                reasons.append("Occupation criteria satisfied")
                
            # Gender Check
            req_gender = rule.get("gender")
            if req_gender and user_gender not in req_gender:
                failed_checks.append(f"Restricted to {req_gender[0].title()} gender")
            elif req_gender:
                reasons.append("Gender criteria satisfied")
                
            # Disability Check
            req_dis = rule.get("disability")
            if req_dis and user_disability != req_dis:
                failed_checks.append("Differently-abled status required")
            elif req_dis:
                reasons.append("Differently-abled status matches")
                
            # Land Check
            if rule.get("land_required") and user_land == "no":
                failed_checks.append("Farmland ownership required")
            elif rule.get("land_required"):
                reasons.append("Farmland ownership matches")
                
            # Girl Child Check
            if rule.get("girl_child") and user_girl_child != "yes":
                failed_checks.append("Girl child under 10 required")
            elif rule.get("girl_child"):
                reasons.append("Girl child criteria satisfied")
                
            # Stand-up India check
            if rule.get("female_or_sc_st"):
                if user_gender == "female" or user_category in ["sc", "st"]:
                    reasons.append("Gender or SC/ST category satisfied")
                else:
                    failed_checks.append("Requires female gender or SC/ST category")
                    
            # Beti Bachao Beti Padhao check
            if rule.get("girl_child_or_female"):
                if user_gender == "female" or user_girl_child == "yes":
                    reasons.append("Female gender or girl child status satisfied")
                else:
                    failed_checks.append("Requires female gender or girl child status")
        else:
            # Fallback based on category
            db_cat = str(scheme.get("category", "")).lower()
            if "education" in db_cat and user_occupation != "student" and user_age > 25:
                failed_checks.append("Student/youth status required")
            elif "agriculture" in db_cat and user_occupation != "farmer":
                failed_checks.append("Farmer status required")
            else:
                reasons.append("General demographics check satisfied")

        eligible = len(failed_checks) == 0
        
        # Calculate Match Score: base of 100 minus penalty for failed checks
        if eligible:
            score = 100
        else:
            score = max(10, 100 - (len(failed_checks) * 30))
            db_cat = str(scheme.get("category", "")).lower()
            # Bonus score if category matches occupation keyword
            if db_cat == user_occupation or (db_cat == "agriculture" and user_occupation == "farmer") or (db_cat == "education" and user_occupation == "student"):
                score = min(90, score + 15)
        
        matched_scheme = scheme.copy()
        matched_scheme["eligible"] = eligible
        matched_scheme["match_score"] = score
        matched_scheme["reasons"] = reasons
        matched_scheme["failed_checks"] = failed_checks
        
        # Add explanation field
        if rule and rule.get("explanation"):
            matched_scheme["ai_reason"] = f"Recommended for {rule['explanation']}."
        else:
            matched_scheme["ai_reason"] = f"General recommendation based on {scheme.get('category', 'general')} category."
            
        matched_results.append(matched_scheme)
        
    # Sort results
    # 1. Eligible first (eligible=True)
    # 2. Sort by match_score descending
    matched_results.sort(key=lambda x: (1 if x.get("eligible") else 0, x.get("match_score", 0)), reverse=True)
    
    return matched_results
