from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('companies/', views.companies_list_view, name='companies-list'),
    path('company/<str:company_id>/analysis/', views.company_analysis_view, name='company-analysis'),
    path('company/<str:company_id>/forecast/', views.company_forecast_view, name='company-forecast-alt'),
    path('forecast/<str:company_id>/', views.company_forecast_view, name='company-forecast'),
    path('company/<str:company_id>/', views.company_details_view, name='company-details'),

    # Anomaly Detection API endpoints
    path('anomaly-detection/overview/', views.anomaly_overview_view, name='anomaly-overview'),
    path('anomaly-detection/records/', views.anomaly_overview_view, name='anomaly-records'),
    path('anomaly-detection/scan/', views.anomaly_scan_view, name='anomaly-scan'),
    path('anomaly-detection/detail/<int:record_id>/', views.anomaly_detail_view, name='anomaly-detail'),
    path('anomaly-detection/review/<int:record_id>/', views.anomaly_review_view, name='anomaly-review'),
]


