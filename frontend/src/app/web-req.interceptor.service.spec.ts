import { TestBed } from '@angular/core/testing';

import { WebReq.InterceptorService } from './web-req.interceptor';

describe('WebReq.InterceptorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebReq.InterceptorService = TestBed.get(WebReq.InterceptorService);
    expect(service).toBeTruthy();
  });
});
