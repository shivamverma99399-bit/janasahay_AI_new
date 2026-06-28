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
        user: The user profile dictionary.
        schemes: A list of scheme dictionaries fetched from Supabase.
        
    Returns:
        A list of results, with match metadata injected, sorted by match_score descending.
    """
    matched_results = []
    
    # Extract user profile demographics with fallbacks
    user_age = int(user.get("age", 0))
    user_income = float(user.get("income", 0.0))
    user_gender = str(user.get("gender", "")).strip()
    user_state = str(user.get("state", "")).strip()
    user_occupation = str(user.get("occupation", "")).strip()
    user_education = str(user.get("education", "")).strip()
    
    for scheme in schemes:
        # Retrieve eligibility filters from scheme (None if columns don't exist in database)
        min_age = scheme.get("min_age")
        max_age = scheme.get("max_age")
        income_min = scheme.get("income_min")
        income_max = scheme.get("income_max")
        gender = scheme.get("gender")
        state = scheme.get("state")
        occupation = scheme.get("occupation")
        education = scheme.get("education")
        
        # Execute checks
        age_pass, age_reason = check_age(user_age, min_age, max_age)
        income_pass, income_reason = check_income(user_income, income_min, income_max)
        gender_pass, gender_reason = check_gender(user_gender, gender)
        state_pass, state_reason = check_state(user_state, state)
        occupation_pass, occupation_reason = check_occupation(user_occupation, occupation)
        education_pass, education_reason = check_education(user_education, education)
        
        # Determine overall eligibility (all evaluated checks must pass)
        eligible = all([
            age_pass,
            income_pass,
            gender_pass,
            state_pass,
            occupation_pass,
            education_pass
        ])
        
        # Compile match score dictionary
        check_results = {
            "age": age_pass,
            "income": income_pass,
            "gender": gender_pass,
            "state": state_pass,
            "occupation": occupation_pass,
            "education": education_pass
        }
        score = calculate_match_score(check_results)
        
        # Collect passed and failed checks separately
        reasons = []
        failed_checks = []
        for check_pass, reason_str in [
            (age_pass, age_reason),
            (income_pass, income_reason),
            (gender_pass, gender_reason),
            (state_pass, state_reason),
            (occupation_pass, occupation_reason),
            (education_pass, education_reason)
        ]:
            if check_pass:
                reasons.append(reason_str)
            else:
                failed_checks.append(reason_str)
        
        # Copy scheme data and add matching metrics
        matched_scheme = scheme.copy()
        matched_scheme["eligible"] = eligible
        matched_scheme["match_score"] = score
        matched_scheme["reasons"] = reasons
        matched_scheme["failed_checks"] = failed_checks
        
        matched_results.append(matched_scheme)
        
    # Sort by match_score descending, and secondary by eligible descending
    matched_results.sort(key=lambda x: (x.get("match_score", 0), 1 if x.get("eligible") else 0), reverse=True)
    
    return matched_results
