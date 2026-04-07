"""
ai_service.py - Enhanced Mock AI service for topic suggestions.
This version uses a multi-domain knowledge base and heuristic generation
to simulate a high-quality AI recommendation engine.
"""

def suggest_topics(subject_name):
    """
    Suggest common topics for a given subject name using a robust knowledge base
    and fallback generation logic.
    """
    subject = subject_name.lower().strip()
    
    # Comprehensive Expert Knowledge Base
    knowledge_base = {
        # Science & Tech
        "mathematics": ["Algebraic Expressions", "Differential Calculus", "Integral Calculus", "Linear Algebra", "Probability & Statistics", "Trigonometry"],
        "physics": ["Classical Mechanics", "Electromagnetism", "Quantum Mechanics", "Thermodynamics", "Optics", "Nuclear Physics"],
        "biology": ["Cellular Structure", "Genetics & Heredity", "Evolutionary Biology", "Human Physiology", "Ecology & Ecosystems"],
        "chemistry": ["Atomic Theory", "Chemical Kinetics", "Organic Synthesis", "Equilibrium", "Electrochemistry", "Analytical Chemistry"],
        "computer science": ["Algorithm Design", "Computational Complexity", "Software Engineering", "Machine Learning", "Database Systems"],
        "react": ["Hooks (useState/useEffect)", "Component Lifecycle", "Context API", "React Router", "State Management (Redux/Zustand)", "Perf Optimization"],
        "python": ["Advanced List Comprehensions", "Functional Programming", "Object-Oriented Design", "Multithreading/Asyncio", "Scientific Computing (NumPy/Pandas)"],
        
        # Humanities & Social Sciences
        "history": ["The Renaissance", "Industrial Revolution", "World War I & II", "Civil Rights Movement", "Ancient Mediterranean Civilizations"],
        "economics": ["Supply & Demand Curves", "Macroeconomic Policy", "Game Theory", "Behavioral Economics", "International Trade", "Fiscal Policy"],
        "psychology": ["Cognitive Behavioral Theory", "Neurological Basis of Behavior", "Developmental Stages", "Social Psychology Dynamics", "Abnormal Psychology"],
        "literature": ["Critical Literary Theory", "Romanticism vs Realism", "Modernist Poetry", "Shakespearean Dramaturgy", "Post-Colonial Narratives"],
        "philosophy": ["Epistemology", "Ethics & Morality", "Existentialism", "Political Philosophy", "Logic & Critical Thinking"],
        
        # Professional & Business
        "marketing": ["Digital SEO Strategies", "Consumer Psychology", "Brand Identity Design", "Market Segmentation", "Content Strategy", "Email Automation"],
        "management": ["Organizational Behavior", "Strategic Planning", "Project Management Methodologies", "Leadership Styles", "Conflict Resolution"],
        "finance": ["Capital Budgeting", "Risk Management", "Investment Portfolio Theory", "Financial Statement Analysis", "Corporate Governance"],
    }
    
    # 1. Direct or Fuzzy Match
    for key, topics in knowledge_base.items():
        if key in subject or subject in key:
            return topics
            
    # 2. Heuristic Generation for unknown subjects
    # If the subject contains certain keywords, generate plausible topics
    keywords = {
        "law": ["Constitutional Framework", "Criminal Justice System", "Contractual Obligations", "Tort Law", "Legal Research", "International Law"],
        "art": ["Aesthetic Principles", "Historical Movements", "Practical Techniques", "Composition & Color Theory", "Digital Media", "Art Criticism"],
        "data": ["Data Acquisition", "Statistical Analysis", "Data Visualization", "Big Data Architectures", "Privacy & Ethics", "Neural Networks"],
        "med": ["Anatomy Overview", "Pathology Basics", "Pharmacology", "Clinical Diagnosis", "Medical Ethics", "Healthcare Systems"],
        "eng": ["Structural Analysis", "Fluid Dynamics", "Materials Science", "Design Optimization", "Sustainability", "Systems Engineering"]
    }
    
    for word, topics in keywords.items():
        if word in subject:
            return topics

    # 3. Smart Fallback for completely unique subjects
    # Uses academic generic structure
    return [
        f"Fundamentals of {subject_name}",
        f"Core Principles and Theories",
        f"Advanced Applications of {subject_name}",
        f"Case Studies and Practical Analysis",
        f"Future Trends and Research",
        f"Comprehensive Summary and Evaluation"
    ]
