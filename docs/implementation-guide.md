# Implementation Guide

## Hướng dẫn tích hợp chức năng Comment và Rating

Dưới đây là hướng dẫn để tích hợp chức năng Comment và Rating từ các controller chuyên biệt vào trong API recipes của bạn:

### 1. Chúng ta đã tạo một file bridge controller mới

File `recipeControllerBridge.ts` đóng vai trò cầu nối giữa các API hiện tại của recipe và các controller chuyên biệt (commentController và ratingController). Khi API của recipe được gọi, bridge sẽ chuyển đổi định dạng dữ liệu và chuyển tiếp yêu cầu đến controller tương ứng.

### 2. Các route đã được cập nhật

Các route sau đây đã được chuyển hướng để sử dụng bridge controller:
- `/comment-recipe` - Sử dụng commentController.addComment
- `/get-recipe-comments` - Sử dụng commentController.getRecipeComments
- `/rating-recipe` - Sử dụng ratingController.rateRecipe
- `/get-recipe-rating` - Sử dụng ratingController.getRecipeRating
- `/like-comment` - Sử dụng commentController.likeComment
- `/dislike-comment` - Sử dụng commentController.dislikeComment

### 3. Lưu ý về quản lý dữ liệu

Bây giờ các chức năng comment và rating sẽ được lưu trữ và quản lý bởi các controller chuyên biệt, điều này giúp tách biệt logic xử lý và dễ bảo trì code hơn. Mô hình dữ liệu cũng được tổ chức tốt hơn.

### 4. Các thay đổi đã thực hiện

1. Tạo file `recipeControllerBridge.ts` để chuyển tiếp các yêu cầu API
2. Cập nhật `recipeRoutes.ts` để sử dụng bridge controller
3. Các API route từ phía frontend không cần thay đổi, giữ nguyên như cũ

### 5. Kiểm tra

Bạn nên kiểm tra các endpoint sau để đảm bảo chúng hoạt động chính xác:
- Comment API: `/api/recipes/comment-recipe`
- Get comments: `/api/recipes/get-recipe-comments`
- Rating API: `/api/recipes/rating-recipe`
- Get rating: `/api/recipes/get-recipe-rating`
- Like comment: `/api/recipes/like-comment`
- Dislike comment: `/api/recipes/dislike-comment`

### 6. Tiếp theo

Trong tương lai, bạn có thể xem xét việc loại bỏ hoàn toàn các functions không còn cần thiết từ `recipeController.ts` nếu bạn chắc chắn rằng bridge controller đã hoạt động ổn định.
