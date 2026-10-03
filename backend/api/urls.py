from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('companies/', views.companies_list_view, name='companies-list'),
    path('company/<str:company_id>/analysis/', views.company_analysis_view, name='company-analysis'),
    path('company/<str:company_id>/', views.company_details_view, name='company-details'),
]
