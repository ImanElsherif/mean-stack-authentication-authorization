import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tutorial } from '../models/tutorial.model';

const baseUrl = 'http://localhost:8000/api/tutorials';

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Tutorial[]> {
    return this.http.get<Tutorial[]>(baseUrl);
  }

  getPublished(): Observable<Tutorial[]> {
    return this.http.get<Tutorial[]>(`${baseUrl}/published`);
  }


  get(id: any): Observable<Tutorial> {
    return this.http.get<Tutorial>(`${baseUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(baseUrl, data);
  }

  update(id: any, data: any): Observable<any> {
    return this.http.put(`${baseUrl}/${id}`, data);
  }

  delete(id: any): Observable<any> {
    return this.http.delete(`${baseUrl}/${id}`);
  }

  deleteAll(): Observable<any> {
    return this.http.delete(baseUrl);
  }

  findByTitle(title: any): Observable<Tutorial[]> {
    return this.http.get<Tutorial[]>(`${baseUrl}?title=${title}`);
  }

  findByVendorID(vendorID: any): Observable<Tutorial[]> {
    return this.http.get<Tutorial[]>(`${baseUrl}/VendorID?vendorID=${vendorID}`);
  }

  deleteAllByVendorID(vendorID: any): Observable<Tutorial[]> {
    return this.http.delete<Tutorial[]>(`${baseUrl}/VendorIDdel/vendorID?vendorID=${vendorID}`);
  }
  findPublishedByVendorID(vendorID: any): Observable<Tutorial[]> {
    return this.http.get<Tutorial[]>(`${baseUrl}/published/vendorID?vendorID=${vendorID}`);
  }
}
