from django.urls import path
from . import views

urlpatterns = [
    # Health & Meta
    path('health/', views.health_check, name='health-check'),
    path('companies/', views.companies_list_view, name='companies-list'),

    # Authentication & Multi-Company Registration
    path('auth/register/', views.auth_register_view, name='auth-register'),
    path('auth/login/', views.auth_login_view, name='auth-login'),
    path('auth/me/', views.auth_me_view, name='auth-me'),

    # Financial CSV Template, Validation, and Ingestion
    path('csv/template/', views.csv_template_view, name='csv-template'),
    path('csv/validate/', views.csv_validate_view, name='csv-validate'),
    path('csv/import/', views.csv_import_view, name='csv-import'),
    path('csv/history/', views.csv_history_view, name='csv-history'),

    # Company Financial Analysis & Details
    path('company/<str:company_id>/analysis/', views.company_analysis_view, name='company-analysis'),
    path('company/<str:company_id>/forecast/', views.company_forecast_view, name='company-forecast-alt'),
    path('forecast/<str:company_id>/', views.company_forecast_view, name='company-forecast'),
    path('forecast/cash-flow/<str:company_id>/', views.company_cash_flow_forecast_view, name='company-cash-flow-forecast'),
    path('company/<str:company_id>/forecast/cash-flow/', views.company_cash_flow_forecast_view, name='company-cash-flow-forecast-alt'),
    path('company/<str:company_id>/', views.company_details_view, name='company-details'),

    # Anomaly Detection API endpoints
    path('anomaly-detection/overview/', views.anomaly_overview_view, name='anomaly-overview'),
    path('anomaly-detection/records/', views.anomaly_overview_view, name='anomaly-records'),
    path('anomaly-detection/scan/', views.anomaly_scan_view, name='anomaly-scan'),
    path('anomaly-detection/detail/<int:record_id>/', views.anomaly_detail_view, name='anomaly-detail'),
    path('anomaly-detection/review/<int:record_id>/', views.anomaly_review_view, name='anomaly-review'),
]
